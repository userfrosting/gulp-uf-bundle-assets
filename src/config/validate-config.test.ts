import test from "ava";
import ValidateConfig from "./validate-config";
import { Config } from "./config";

/**
 * Should complete without throwing.
 */
test("Empty object", t => {
	t.notThrows(() => ValidateConfig({}));
});

/**
 * Should complete without throwing.
 */
test("Empty object bundle property", t => {
	const input: any = {
		bundle: {}
	}
	t.notThrows(() => ValidateConfig(input));
});

/**
 * Should throw when bundle property is not an object.
 */
test("Invalid bundle property", t => {
	const input: any = {
		bundle: "a string"
	}
	t.throws(
        () => ValidateConfig(input),
        `Property "bundle" must be an object and not null.`
    );
});

/**
 * Should complete without throwing.
 */
test("Valid virtual path rules", t => {
	const input: Config = {
		VirtualPathRules: [
			["test", "testtest"]
		]
	}
	t.notThrows(() => ValidateConfig(input));
});

/**
 * Should throw when an invalid empty matcher is used for virtual path rules.
 */
test("Invalid empty matcher virtual path rules", t => {
	const input: Config = {
		VirtualPathRules: [
			["", "testtest"]
		]
	}
	t.throws(
        () => ValidateConfig(input),
        `Value matcher of property "VirtualPathRules" is empty.`
    );
});

/**
 *Should throw when an invalid empty replacement is used for virtual path rules.
 */
test("Invalid empty replacement virtual path rules", t => {
	const input: Config = {
		VirtualPathRules: [
			["test", ""]
		]
	}
	t.throws(
        () => ValidateConfig(input),
        `Value replacement of property "VirtualPathRules" is empty.`
    );
});
