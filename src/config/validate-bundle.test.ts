import test from "ava";
import { Bundle } from "./config.js";
import { ValidateBundle } from "./validate-bundle.js";

/**
 * Should complete without throwing.
 */
test("Empty object", t => {
    t.notThrows(() => ValidateBundle({}, "test"));
});

/**
 * Should throw if the bundle is not an object.
 */
test("Non-object bundle", t => {
    const bundle: any = "a string";
    t.throws(
        () => ValidateBundle(bundle, "test"),
        {
            instanceOf: TypeError,
            message: "Property bundle>test must be an object and not null.",
        }
    );
});

/**
 * Should throw if the bundle name is not a string.
 */
test("Non-string bundle name", t => {
    const bundleName: any = 22;
    t.throws(
        () => ValidateBundle({}, bundleName),
        {
            instanceOf: TypeError,
            message: "Bundle name must be a string.",
        }
    );
});

/**
 * Should throw if the scripts property of bundle is not an array.
 */
test("Non-array for scripts", t => {
    const bundle: any = {
        scripts: "a string"
    };
    t.throws(
        () => ValidateBundle(bundle, "test"),
        {
            instanceOf: TypeError,
            message: "Property bundle>test>scripts must be an array.",
        }
    );
});

/**
 * Should throw if an index of scripts array of bundle is not a string.
 */
test("Array containing non-strings for scripts", t => {
    const bundle: any = {
        scripts: [
            "foo.js",
            () => "magic.js",
            22
        ]
    };
    t.throws(
        () => ValidateBundle(bundle, "test"),
        {
            instanceOf: TypeError,
            message: "All indexes of bundle>test>scripts must be a string.",
        }
    );
});

/**
 * Should complete without throwing.
 */
test("Valid array for scripts", t => {
    const bundle: Bundle = {
        scripts: [
            "foo.js",
            "bar.js"
        ]
    };
    t.notThrows(() => ValidateBundle(bundle, "test"));
});

/**
 * Should throw if the styles property of bundle is not an array.
 */
test("Non-array for styles", t => {
    const bundle: any = {
        styles: "a string"
    };
    t.throws(
        () => ValidateBundle(bundle, "test"),
        {
            instanceOf: TypeError,
            message: "Property bundle>test>styles must be an array.",
        }
    );
});

/**
 * Should throw if an index of styles array of bundle is not a string.
 */
test("Array containing non-strings for styles", t => {
    const bundle: any = {
        styles: [
            "foo.css",
            () => "magic.css",
            22
        ]
    };
    t.throws(
        () => ValidateBundle(bundle, "test"),
        {
            instanceOf: TypeError,
            message: "All indexes of bundle>test>styles must be a string.",
        }
    );
});

/**
 * Should complete without throwing.
 */
test("Valid array for styles", t => {
    const bundle: Bundle = {
        styles: [
            "foo.css",
            "bar.css"
        ]
    };
    t.notThrows(() => ValidateBundle(bundle, "test"));
});
