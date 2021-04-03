import { Bundle } from "./config.js";

/**
 * Throws an exception if the provided bundle is invalid.
 * @param bundle Bundle to analyse.
 * @param name Name of bundle.
 */
export function ValidateBundle(bundle: Bundle, name: string): void {
    if (typeof name !== "string")
        throw new TypeError("Bundle name must be a string.");

    if (typeof bundle !== "object" || bundle === null)
        throw new TypeError(`Property bundle>${name} must be an object and not null.`);

    // If scripts key exists, it must be an array of strings
    if ("scripts" in bundle) {
        const scripts = bundle.scripts;

        if (!Array.isArray(scripts))
            throw new TypeError(`Property bundle>${name}>scripts must be an array.`);

        scripts.forEach(path => {
            if (typeof path !== "string")
                throw new TypeError(`All indexes of bundle>${name}>scripts must be a string.`);
        });
    }

    // If styles key exists, it must be an array of strings
    if ("styles" in bundle) {
        const styles = bundle.styles;

        if (!Array.isArray(styles))
            throw new TypeError(`Property bundle>${name}>styles must be an array.`);

        styles.forEach(path => {
            if (typeof path !== "string")
                throw new TypeError(`All indexes of bundle>${name}>styles must be a string.`);
        });
    }
}
