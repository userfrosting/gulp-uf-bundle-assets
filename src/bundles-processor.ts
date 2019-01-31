import Vinyl, { isVinyl } from "vinyl";
import { Catcher } from "./catcher";
import { BundlerStreamFactory } from "./main";
import { Readable } from "stream";
import { LogLevel } from "./config";

/**
 * Processes provided bundle definitions.
 * @param files Map of files and virtual paths to take bundle resources from.
 * @param bundles Definition of bundles to build.
 * @param bundleStreamFactory Source of streams used to generate bundles.
 */
export async function BundlesProcessor(
    files: Map<string, [Vinyl, number]>,
    bundles: Map<string, string[]>,
    bundleStreamFactory: BundlerStreamFactory,
    logger: (value: string, level: LogLevel) => void
): Promise<[any[], Map<string, Vinyl[]>]> {
    try {
        // Track results
        const resultFileInfo: Map<string, Vinyl[]> = new Map();
        const resultChunks = [];

        // Process each bundle
        for (const [name, paths] of bundles) {
            logger(`Building bundle "${name}"`, LogLevel.Normal);

            // Build bundler with source and bundle name
            logger("Invoking provided bundler", LogLevel.Silly);

            // Wrap to permit catching and reporting of errors
            const chunks = await new Promise<any[]>(async (resolve, reject) => {
                try {
                    // Create catcher
                    const catcher = new Catcher(logger);

                    // Create bundle source (and handle errors)
                    const source = new BundleSource(files, paths)
                    .on("error", (e) => {
                        reject(e);
                    });

                    // Run provided transform stream factory
                    bundleStreamFactory(source, name)
                        .pipe(catcher);

                    // Resolve on catcher completion
                    resolve(await catcher.Collected);
                }
                catch (e) {
                    reject(e);
                }
            });

            // Catch results
            logger("Catching outputs", LogLevel.Silly);

            // Add to resultPaths and resultChunks
            const resultFiles: Vinyl[] = [];
            for (const chunk of chunks) {
                // Copy and track a null file version of each vinyl file
                if (isVinyl(chunk) && chunk.path) {
                    const resultFile = chunk.clone();
                    resultFile.contents = null;
                    resultFiles.push(resultFile);
                }
                else logger("Non-Vinyl or Vinyl without path chunk was recieved from bundle factory. Information was not captured.", LogLevel.Complain);

                // Store the chunk
                resultChunks.push(chunk);
            }

            // Store the chunkPaths
            resultFileInfo.set(name, resultFiles)
        }

        logger("Returning bundling results", LogLevel.Silly);
        return [resultChunks, resultFileInfo];
    }
    catch (error) {
        logger("BundlesProcessor completed with error", LogLevel.Scream);
        throw error;
    }
}

/**
 * Data source for bundler.
 */
class BundleSource extends Readable {
    /**
     * Paths yet to be processed.
     */
    private readonly paths: string[];

    /**
     * Map to pull fully resolved files from.
     */
    private readonly files: Map<string, [Vinyl, number]>;

    /**
     * @param files File map to retrieve files from.
     * @param paths Paths to use as keys in file map.
     */
    constructor(files: Map<string, [Vinyl, number]>, paths: string[]) {
        super({
            objectMode: true
        });

        this.files = files;

        // Copy array to we can reduce it as we go
        this.paths = paths.slice(0);
    }

    /**
     * Reads in the next file if there is one.
     */
    _read() {
        if (this.paths.length > 0) {
            const path = this.paths.shift();
            if (this.files.has(path)) this.push(this.files.get(path)[0].clone());
            else this.emit("error", new Error(`No file could be resolved for "${path}".`));
        }
        else this.push(null);
    }
}
