import { errorCaster } from "./error-caster.js";
import test from "ava";

test("Preserves error instances", t => {
    const expected = new Error();
    const actual = errorCaster(expected);
    t.is(actual, expected);
});

test("Wraps non-errors", t => {
    const pretender = "non-error";
    const actual = errorCaster(pretender);
    t.assert(actual instanceof Error);
    t.not(actual, pretender);
});
