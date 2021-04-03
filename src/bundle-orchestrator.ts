import Vinyl from "vinyl";
import { Transform, TransformCallback } from "stream";
import TsLog from "ts-log";
import { Config } from "./config/config.js";
import { resolve as resolvePath } from "path";
import PluginError from "plugin-error";
import { BundleStreamFactory, Bundle, BundleTypes } from "./bundle.js";

const PluginName = "@userfrosting/gulp-bundle-assets";

/**
 * Bundler results data shape.
 * @public
 */
export type Results = Record<BundleTypes, Map<string, Vinyl[]>>;

/**
 * Bundler results callback function interface.
 * @param results - Results data.
 * @public
 */
export type ResultsCallback = (results: Results) => void;

/**
 * Interface defining factories required to bundle styles and scripts.
 * @public
 */
export type Bundlers = Record<BundleTypes, BundleStreamFactory>;

/**
 * Helper responsible for constructing bundle instances.
 * @param name - Name of bundle.
 * @param rawPaths - Array of paths to assets which have not yet been fully resolved.
 * @param cwd - The current working directory to use for resolving raw paths.
 * @param bundler - User provided 'glue' functions.
 * @param logger - Logging interface.
 */
function bundleFactory(
    name: string,
    type: BundleTypes,
    rawPaths: readonly string[],
    cwd: string,
    bundler: BundleStreamFactory,
    logger: TsLog.Logger
) {
    const paths = [];
    for (const rawPath of rawPaths) {
        logger.trace(`Original path: ${rawPath}`);
        const path = resolvePath(cwd, rawPath);
        paths.push(path);
        logger.trace(`Resolved path: "${path}"`);
    }
    return new Bundle(name, type, paths, bundler, logger);
}

/**
 * Helper responsible for 'offering' chunks (Vinyl instances) to bundles.
 * Removes bundles from set if they have all their needed chunks.
 * @param chunk - A Vinyl instance.
 * @param bundles - Set of bundles that will be offered chunk.
 * @param tracker - Tracks bundles and their chunks.
 * @param push - Callback used to push out completed bundles.
 */
async function handleVinylChunk(
    chunk: Vinyl,
    bundles: Set<Bundle>,
    push: (chunk: any) => void,
    tracker?: Map<string, Vinyl[]>,
) {
    for (const bundle of bundles) {
        const results = await bundle.feed(chunk);
        if (results) {
            bundles.delete(bundle);

            if (tracker) {
                // Create an immutable copy, sans contents, for results callback
                const resultRefs = results.map(result => {
                    const resultRef = result.clone({ contents: false });
                    resultRef.contents = null;
                    return resultRef;
                });
                tracker.set(bundle.name, resultRefs);
            }

            for (const result of results) {
                push(result);
            }
        }
    }
}

function addBundle(bundles: Map<string, Set<Bundle>>, type: BundleTypes, bundle: Bundle) {
    let typeBundles = bundles.get(type);
    if (!typeBundles) typeBundles = new Set();
    typeBundles.add(bundle);
    bundles.set(type, typeBundles);
}

/**
 * Orchestrates bundling.
 * @public
 */
export class BundleOrchestrator extends Transform {

    private bundles: Map<BundleTypes, Set<Bundle>> = new Map();

    private results?: {
        callback: ResultsCallback,
        data: Results,
    };

    private logger: TsLog.Logger = TsLog.dummyLogger;

    /**
     * @param config - Raw (but valid) configuration file used for bundle resolution.
     * @param bundlers - Object capable of generating the Transform streams needed for generation of final bundles.
     * @param resultsCallback - Callback invoked once all bundles generated.
     */
    constructor(config: Config, bundlers: Bundlers, resultsCallback?: ResultsCallback) {
        super({
            objectMode: true,
        });
        this.push = this.push.bind(this);

        // First up, we assign the logger if its there
        /* c8 ignore else */
        if (config.Logger) this.logger = config.Logger;

        // Results callback
        if (resultsCallback) {
            this.results = {
                callback: resultsCallback,
                data: {
                    scripts: new Map(),
                    styles: new Map(),
                }
            }
        }

        // Current working directory
        const cwd = config.cwd ?? process.cwd();

        // Add bundles
        if (config.bundle) {
            for (const name of Object.getOwnPropertyNames(config.bundle)) {
                const bundle = config.bundle[name];

                for (const type of Object.getOwnPropertyNames(bundle)) {
                    const castType = type as BundleTypes;
                    const typeBundle = bundle[castType];
                    if (typeBundle) {
                        this.logger.trace(`Starting processing of ${type} paths`);
                        addBundle(this.bundles, castType, bundleFactory(name, castType, typeBundle, cwd, bundlers[castType], this.logger));
                        this.logger.trace(`Completed processing of ${type} paths`);
                    }
                }
            }
        }
    }

    /**
     * Collects copies of applicable files to later bundle.
     *
     * @param chunk - Stream chunk, may be a Vinyl object.
     * @param encoding - Encoding of chunk, if applicable.
     * @param callback - Callback to indicate processing is completed.
     */
    public async _transform(chunk: unknown, encoding: BufferEncoding, callback: TransformCallback): Promise<void> {
        try {
            // Only handle Vinyl chunks
            if (!Vinyl.isVinyl(chunk)) {
                this.logger.warn("Ignoring received non-Vinyl chunk");
                this.push(chunk, encoding);
                callback();
                return;
            }

            this.logger.trace("Received Vinyl chunk", { pathHistory: chunk.history });

            // Offer chunks to bundles, return any results
            for (const [type, typeBundles] of this.bundles) {
                await handleVinylChunk(chunk, typeBundles, this.push, this.results?.data?.[type]);
            }

            // Push chunk on through
            this.push(chunk);

            callback();
        }
        /* c8 ignore next 4 */
        catch (error) {
            this.logger.error("_transform completed with error", { error });
            callback(new PluginError(PluginName, error));
        }
    }

    /**
     * Triggers completion of bundling process.
     * @param callback - callback to indicate processing is completed.
     */
    public async _flush(callback: TransformCallback): Promise<void> {
        try {
            // Produce error if there are bundles without all requirements
            if (Array.from(this.bundles).reduce((result, [_, typeBundles]) => result + typeBundles.size, 0) > 0) {
                const missingBundles: {
                    type: string,
                    name: string,
                    remainingFiles: string[],
                }[] = [];
                for (const [_, typeBundles] of this.bundles) {
                    for (const bundle of typeBundles) {
                        missingBundles.push(bundle.report())
                    }
                }
                const errMessage = "Stream completed before all bundles received their dependencies";
                this.logger.error(errMessage, missingBundles);
                throw new Error(errMessage);
            }

            // Invoke results callback
            if (this.results) this.results.callback(this.results.data);

            callback();
        }
        catch (error) {
            this.logger.error("_flush completed with error", { error: error.toString() });
            callback(new PluginError(PluginName, error));
        }
    }
}
