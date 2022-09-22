import { Bundle, CollisionReactions } from "./config.js";

/**
 * Throws an exception if the provided bundle is invalid.
 * @param bundle Bundle to analyze.
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

    // If options key exists, it must be an object
    if ("options" in bundle) {
        const options = bundle.options;

        if (typeof options !== "object" || options === null)
            throw new TypeError(`Property bundle>${name}>options must be an object and not null.`);

        // If sprinkle key exists, value must be an object
        if ("sprinkle" in options) {
            const sprinkle = options.sprinkle;

            if (typeof sprinkle !== "object" || sprinkle === null)
                throw new TypeError(`Property bundle>${name}>options>sprinkle must be an object and not null.`);

            // If onCollision exists, value must be a string and match a set of values
            if ("onCollision" in sprinkle) {
                if (typeof sprinkle.onCollision !== "string")
                    throw new TypeError(`Property bundle>${name}>options>sprinkle>onCollision must be a string.`);
                if (Object.keys(CollisionReactions).indexOf(sprinkle.onCollision) === -1)
                    throw new TypeError(`Property bundle>${name}>options>sprinkle>onCollision must be a valid rule.`);
            }
        }
    }
}
