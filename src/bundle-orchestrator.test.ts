import test, { ExecutionContext } from "ava";
import { BundleOrchestrator, ResultsCallback } from "./bundle-orchestrator.js";
import intoStream from "into-stream";
import { Readable, Stream } from "stream";
import Vinyl from "vinyl";
import { resolve as resolvePath } from "path";
import sortOn from "sort-on";
import { logAdapter } from "@userfrosting/ts-log-adapter-ava";
import pDefer from "p-defer";

/**
 * Returns a pretend bundle for testing purposes.
 * @param name Name of bundle.
 */
function bundleFactoryJs(_: Readable, name: string): Readable {
    let first = true;
    const newSrc = new Readable({
        objectMode: true,
        read() {
            if (first) {
                first = false;
                this.push(new Vinyl({ path: resolvePath(name + ".js") }))
            } else {
                this.push(null);
            }
        }
    });

    return newSrc;
}

/**
 * Returns a pretend bundle for testing purposes.
 * @param name Name of bundle.
 */
function bundleFactoryCss(_: Readable, name: string): Readable {
    let first = true;
    const newSrc = new Readable({
        objectMode: true,
        read() {
            if (first) {
                first = false;
                this.push(new Vinyl({ path: resolvePath(name + ".css") }))
            } else {
                this.push(null);
            }
        }
    });

    return newSrc;
}

interface IBundleBuilderFlags {
    /**
     * Explicitly set cwd.
     */
    explicitCwd?: boolean;

    /**
     * Don't include any bundle specs.
     */
    noBundles?: boolean;

    /**
     * Don't include any style bundles.
     */
    noStyleBundles?: boolean;

    /**
     * Don't include any script bundles.
     */
    noScriptBundles?: boolean;

    /**
     * Results callback to include.
     */
    resultsCallback?: ResultsCallback;
}

/**
 * Tool to help build bundler for tests.
 * @param t Execution context from test.
 * @param flags Flags used to modify returned bundler.
 */
function buildBundler(t: ExecutionContext, flags: IBundleBuilderFlags = {}) {
    return new BundleOrchestrator(
        {
            cwd: flags.explicitCwd
                ? process.cwd()
                : undefined,
            Logger: logAdapter(t.log),
            bundle: flags.noBundles
                ? undefined
                : {
                bund1: {
                    scripts: flags.noScriptBundles
                        ? undefined
                        : [
                            "./123/bar.js",
                            "./abc/foo.js",
                        ],
                    styles: flags.noStyleBundles
                        ? undefined
                        : [
                            "./123/foo.css",
                            "./abc/foo.css",
                        ]
                }
            }
        },
        {
            Scripts: bundleFactoryJs,
            Styles: bundleFactoryCss,
        },
        flags.resultsCallback
            ? flags.resultsCallback
            : undefined,
    );
}

test("Bundles with all dependencies met", async t => {
    t.plan(5);

    const resultsCallbackCompletion = pDefer();
    const resultsCallback: ResultsCallback = function (results) {
        t.is(
            Array.from(results.scripts.values()).reduce<number>((numFiles, files) => numFiles + files.length, 0),
            1,
            "Should be exactly 1 file"
        );
        t.is(
            Array.from(results.scripts.values()).some(results => results.some(result => result.contents !== null)),
            false,
            "Vinyl instances should not contain reference to actual file data"
        ); 
        t.is(
            Array.from(results.styles.values()).reduce<number>((numFiles, files) => numFiles + files.length, 0),
            1,
            "Should be exactly 1 file"
        );
        t.is(
            Array.from(results.styles.values()).some(results => results.some(result => result.contents !== null)),
            false,
            "Vinyl instances should not contain reference to actual file data"
        ); 
        resultsCallbackCompletion.resolve();
    };

    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.js") }),
    ])
        .pipe(buildBundler(t, { resultsCallback }));

    const results: Vinyl[] = [];
    for await (const result of testStream) {
        results.push(result);
    }

    t.deepEqual(
        sortOn(results, 'history'),
        sortOn(
            [
                // Original inputs
                new Vinyl({ path: resolvePath("./123/bar.js") }),
                new Vinyl({ path: resolvePath("./123/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.js") }),
                // Bundles
                new Vinyl({ path: resolvePath("./bund1.js") }),
                new Vinyl({ path: resolvePath("./bund1.css") }),
            ],
            'history'
        )
    );

    await resultsCallbackCompletion.promise;
});

/**
 * @todo This should be improved to account for _different_ `cwd`s. Currently UserFrosting covers
 * this via its usage of this library.
 */
test("Bundles with all dependencies met and custom cwd", async t => {
    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.js") }),
    ])
        .pipe(buildBundler(t, { explicitCwd: true }));
    const results: Vinyl[] = [];
    for await (const result of testStream) {
        results.push(result);
    }

    t.deepEqual(
        sortOn(results, 'history'),
        sortOn(
            [
                // Original inputs
                new Vinyl({ path: resolvePath("./123/bar.js") }),
                new Vinyl({ path: resolvePath("./123/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.js") }),
                // Bundles
                new Vinyl({ path: resolvePath("./bund1.js") }),
                new Vinyl({ path: resolvePath("./bund1.css") }),
            ],
            'history'
        )
    );
});

test("No bundles to build", async t => {
    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.js") }),
    ])
        .pipe(buildBundler(t, { noBundles: true }));
    const results: Vinyl[] = [];
    for await (const result of testStream) {
        results.push(result);
    }

    t.deepEqual(
        sortOn(results, 'history'),
        sortOn(
            [
                // Original inputs
                new Vinyl({ path: resolvePath("./123/bar.js") }),
                new Vinyl({ path: resolvePath("./123/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.js") }),
            ],
            'history'
        )
    );
});

test("No style bundles", async t => {
    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.js") }),
    ])
        .pipe(buildBundler(t, { noStyleBundles: true }));
    const results: Vinyl[] = [];
    for await (const result of testStream) {
        results.push(result);
    }

    t.deepEqual(
        sortOn(results, 'history'),
        sortOn(
            [
                // Original inputs
                new Vinyl({ path: resolvePath("./123/bar.js") }),
                new Vinyl({ path: resolvePath("./123/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.js") }),
                // Bundles
                new Vinyl({ path: resolvePath("./bund1.js") }),
            ],
            'history'
        )
    );
});

test("No script bundles", async t => {
    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.js") }),
    ])
        .pipe(buildBundler(t, { noScriptBundles: true }));
    const results: Vinyl[] = [];
    for await (const result of testStream) {
        results.push(result);
    }

    t.deepEqual(
        sortOn(results, 'history'),
        sortOn(
            [
                // Original inputs
                new Vinyl({ path: resolvePath("./123/bar.js") }),
                new Vinyl({ path: resolvePath("./123/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.css") }),
                new Vinyl({ path: resolvePath("./abc/foo.js") }),
                // Bundles
                new Vinyl({ path: resolvePath("./bund1.css") }),
            ],
            'history'
        )
    );
});

test("Non-vinyl chunk pushed out when feed in", async t => {
    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.js") }),
        "nonsense-input",
    ])
        .pipe(buildBundler(t));
    try {
        const results: (Vinyl|string)[] = [];
        for await (const result of testStream) {
            results.push(result);
        }

        t.true(results.includes("nonsense-input"));
    } catch (e) {
        t.log(e);
        t.fail();
    }
});

test("Bundles with unmet dependencies", async t => {
    const testStream = intoStream.object([
        new Vinyl({ path: resolvePath("./123/bar.js") }),
        new Vinyl({ path: resolvePath("./123/foo.css") }),
        new Vinyl({ path: resolvePath("./abc/foo.css") }),
    ])
        .pipe(buildBundler(t));
    await t.throwsAsync(
        async function () {
            for await (const _ of testStream) {}
        },
        {
            instanceOf: Error,
            message: "Stream completed before all bundles received their dependencies",
        }
    );
});

test("Bundles with all dependencies unmet", async t => {
    const testStream = intoStream.object([])
        .pipe(buildBundler(t));
    await t.throwsAsync(
        async function () {
            for await (const _ of testStream) {}
        },
        {
            instanceOf: Error,
            message: "Stream completed before all bundles received their dependencies",
        }
    );
});
