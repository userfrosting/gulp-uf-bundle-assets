import test from "ava";
import { validateConfig } from "./validate-config.js";
import { Config } from "./config.js";

/**
 * Should complete without throwing.
 */
test("Empty object", t => {
	t.notThrows(() => validateConfig({}));
});

/**
 * Should complete without throwing.
 */
test("Empty object bundle property", t => {
	const config: any = {
		bundle: {
            foo: {}
        }
	}
	t.notThrows(() => validateConfig(config));
});

/**
 * Should complete without throwing.
 */
test("Valid bundle property", t => {
	const config: Config = {
		bundle: {}
	}
	t.notThrows(() => validateConfig(config));
});

/**
 * Should throw when bundle property is not an object.
 */
test("Non-object bundle property", t => {
	const config: any = {
		bundle: "a string"
	}
	t.throws(
        () => validateConfig(config),
        {
            instanceOf: TypeError,
            message: `Property "bundle" must be an object and not null.`,
        }
    );
});
