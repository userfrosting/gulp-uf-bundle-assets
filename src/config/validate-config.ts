import { Config } from "./config.js";
import { validateBundle } from "./validate-bundle.js";

/**
 * Throws an exception if the provided raw config contains invalid data.
 * @param config - Raw configuration to validate.
 * @public
 */
export function validateConfig(config: Config): void {
    // If bundle key exists, value must be an object
    if ("bundle" in config) {
        const bundles = config.bundle;

        if (typeof bundles !== "object" || bundles === null) {
            throw new TypeError(`Property "bundle" must be an object and not null.`);
        }
        else {
            // Each property must be an object (for owned properties)
            for (const bundleName of Object.getOwnPropertyNames(bundles)) {
                validateBundle(bundles[bundleName], bundleName);
            }
        }
    }
}
