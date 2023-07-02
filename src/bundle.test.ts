import test from "ava";
import { Bundle } from "./bundle.js";
import { Readable } from "stream";
import { resolve as resolvePath } from "path";
import Vinyl from "vinyl";
import intoStream from "into-stream";
import { logAdapter } from "@userfrosting/ts-log-adapter-ava";

/**
 * Returns stream factory was provided, without modification.
 * @param src Source stream
 */
function bundleFactoryEcho(src: Readable): Readable {
    return src;
}

test("Ignores unused files", async t => {
    const bundle = new Bundle(
        "test",
        "script",
        [
            resolvePath("./test-used-1.js"),
            resolvePath("./test-used-2.js"),
        ],
        bundleFactoryEcho,
        logAdapter(t.log),
    );

    t.is(
        await bundle.feed(new Vinyl({ path: resolvePath("./test-unused-1.js") })),
        false
    );

    t.is(
        await bundle.feed(new Vinyl({ path: resolvePath("./test-used-1.js") })),
        false
    );

    t.is(
        await bundle.feed(new Vinyl({ path: resolvePath("./test-unused-2.js") })),
        false
    );
});

test("Returns a stream once feed sends in the last required file", async t => {
    const bundle = new Bundle(
        "test",
        "script",
        [
            resolvePath("./test-1.js"),
            resolvePath("./test-2.js"),
        ],
        bundleFactoryEcho,
        logAdapter(t.log),
    );

    t.is(
        await bundle.feed(new Vinyl({ path: resolvePath("./test-1.js") })),
        false
    );

    t.deepEqual(
        await bundle.feed(new Vinyl({ path: resolvePath("./test-2.js") })),
        [
            new Vinyl({ path: resolvePath("./test-1.js") }),
            new Vinyl({ path: resolvePath("./test-2.js") }),
        ]
    );
});

test("Multiple non-Vinyl chunks returned by bundle stream", async t => {
    const bundle = new Bundle(
        "test",
        "script",
        [ resolvePath("./test-1.js") ],
        function (): Readable {
            return intoStream.object([ {}, {} ]);
        },
        logAdapter(t.log),
    );

    await t.throwsAsync(
        () => bundle.feed(new Vinyl({ path: resolvePath("./test-1.js") })),
        {
            message: "Non-Vinyl chunk returned by bundle stream for bundle 'test'",
            instanceOf: Error,
        },
    );
});

test("Single non-Vinyl chunks returned by bundle stream", async t => {
    const bundle = new Bundle(
        "test",
        "script",
        [ resolvePath("./test-1.js") ],
        function (): Readable {
            return intoStream.object({});
        },
        logAdapter(t.log),
    );

    await t.throwsAsync(
        () => bundle.feed(new Vinyl({ path: resolvePath("./test-1.js") })),
        {
            message: "Non-Vinyl chunk returned by bundle stream for bundle 'test'",
            instanceOf: Error,
        },
    );
});
