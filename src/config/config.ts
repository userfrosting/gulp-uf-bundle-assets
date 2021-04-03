import { BundleTypes } from "../bundle.js";
import TsLog from "ts-log";

/**
 * Represents an asset bundle. An asset bundle is further broken down into typed bundles.
 * @public
 */
export type Bundle = Partial<Record<BundleTypes, readonly string[]>>;

/**
 * Map of bundles.
 * @public
 */
export interface Bundles {
    /**
     * A named asset bundle.
     */
    readonly [x: string]: Bundle;
}

/**
 * Root object of raw configuration.
 * @public
 */
export interface Config {
    /**
     * Bundle definitions.
     */
    readonly bundle?: Bundles;

    /**
     * Optional logger that will be used throughout bundling process.
     */
    readonly Logger?: TsLog.Logger;

    /**
     * Current working directory to use when resolving the full paths of bundle dependencies.
     * Defaults to `process.cwd()`.
     */
    readonly cwd?: string;
}
