import { Readable } from "stream";
import Vinyl from "vinyl";
import TsLog from "ts-log";
import intoStream from "into-stream";

/**
 * A function that returns a stream that will be used to bundle assets.
 * @public
 */
export interface BundleStreamFactory {
    /**
     * @param src - Source stream.
     * @param name - Name of bundle.
     */
    (src: Readable, name: string): Readable;
}

export type BundleType = "style" | "script";

/**
 * Represents a bundle to be bundled, assists in process.
 */
export class Bundle {
    public readonly name: string;
    private readonly type: BundleType;
    private readonly initialPaths: readonly string[];
    private remainingPaths: string[];
    private readonly files: Map<string, Vinyl> = new Map();
    private readonly streamFactory: BundleStreamFactory;
    private readonly logger: TsLog.Logger;

    /**
     * @param name Name of bundle, passed to bundle stream factory.
     * @param paths Paths of files this bundle consists of.
     * @param streamFactory The bundle stream factory.
     */
    constructor(
        name: string,
        type: BundleType,
        paths: string[],
        streamFactory: BundleStreamFactory,
        logger: TsLog.Logger
    ) {
        this.name = name;
        this.type = type;
        this.initialPaths = paths.slice(0);
        this.remainingPaths = paths.slice(0);
        this.streamFactory = streamFactory;
        this.logger = logger;
        this.logger.trace(
            "Bundle tracker created",
            {
                bundleName: this.name,
                type: this.type,
                files: this.initialPaths,
            }
        );
    }

    /**
     * Takes a file and returns a Vinyl instance or false depending on if requirements have been met.
     * Unused files are ignored.
     * @param file Vinyl instance of a file that bundle may need.
     */
    public async feed(file: Vinyl): Promise<false|Vinyl[]> {
        const i = this.remainingPaths.indexOf(file.path);
        if (i !== -1) {
            // Remove index
            this.remainingPaths.splice(i, 1);

            // Retain file
            this.files.set(file.path, file.clone());
            this.logger.trace(
                "Retaining file for later bundling",
                {
                    bundleName: this.name,
                    type: this.type,
                    path: file.path,
                }
            );
        }
        else {
            this.logger.trace(
                "Ignoring unused file",
                {
                    bundleName: this.name,
                    type: this.type,
                    path: file.path,
                }
            );
        }

        if (this.remainingPaths.length === 0) {
            const orderedFiles: Vinyl[] = [];
            for (const path of this.initialPaths) {
                const file = this.files.get(path);
                if (file) orderedFiles.push(file);
                /* c8 ignore next */
                else throw new Error("Unexpected condition, previously tracked file is undefined");
            }

            // Perform bundling, and collect results
            this.logger.trace(
                "Creating bundle stream",
                {
                    bundleName: this.name,
                    type: this.type,
                    inFiles: this.initialPaths,
                }
            );
            this.logger.info("Started bundling", { bundleName: this.name, type: this.type });
            const bundleStream = this.streamFactory(
                intoStream.object(orderedFiles),
                this.name
            );
            const chunks: unknown[] = [];
            for await (const result of bundleStream) {
                chunks.push(result);
            }

            // Verify results are all Vinyl instances
            for (const chunk of chunks) {
                if (!Vinyl.isVinyl(chunk)) {
                    this.logger.error(
                        "Chunk returned by bundle stream is not a Vinyl instance",
                        {
                            bundleName: this.name,
                            type: this.type,
                            chunk,
                        }
                    );
                    throw new Error(`Non-Vinyl chunk returned by bundle stream for bundle '${this.name}'`);
                }
            }

            // Perform bundling, and collect results
            this.logger.trace("Bundle stream completed", { bundleName: this.name, type: this.type });
            this.logger.info("Finished bundling", { bundleName: this.name, type: this.type });

            return chunks as Vinyl[];
        }
        else {
            return false;
        }
    }

    /**
     * Returns an object used for reporting bundle status when the stream completes before all required
     * files have been received.
     */
    public report() {
        return {
            type: this.type,
            name: this.name,
            remainingFiles: this.remainingPaths.slice(),
        };
    }
}
