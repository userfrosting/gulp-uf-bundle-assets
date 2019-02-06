import test, { ExecutionContext } from "ava";
import Bundler, { Bundlers } from "./main";
import { Transform, Readable, Stream } from "stream";
import { Catcher } from "./catcher";
import Vinyl from "vinyl";
import { Config } from "./config/config";
import { SimplePluginError } from "plugin-error";
import { resolve as resolvePath } from "path";

/**
 * Generic joiner to use for mocking the bundling of resources.
 */
const Joiner: Bundlers = {
    Scripts: () => {
        return new Transform({
            objectMode: true
        });
    },
    Styles: () => {
        return new Transform({
            objectMode: true
        });
    }
};

/**
 * Should complete without throwing, return all files from input stream, and have an empty map returned to the callback.
 */
test("Bundler basic success scenario", async t => {
    // Create bundler args
    const args: BundlerArgs = {
        Config: {},
        Joiner,
        BundleResultsCb: results => t.deepEqual(results, new Map())
    };

    // Define inputs
    const streamInputs = [
        {},
        "test",
        21
    ];

    // Define expected outputs
    const expected = [
        {},
        "test",
        21
    ];

    // Test
    await testBundlerResults(t, args, streamInputs, expected);
});

/**
 * Should throw.
 */
test("Bundler basic failure scenario", async t => {
    // Create bundler args
    const args: BundlerArgs = {
        Config: {
            bundle: {
                test: {
                    styles: [
                        "testpath.css",
                        "test.css"
                    ]
                }
            },
        },
        Joiner
    };

    // Define inputs
    const streamInputs = [
        new Vinyl({contents: Buffer.from("test"), path: "testpath.css"})
    ];

    // Test
    t.plan(1);

    try {
        await bundlerExceptionHoist(args, streamInputs)
    }
    catch (e) {
        t.is((e as SimplePluginError).message, `No file could be resolved for "${resolvePath("./testpath.css")}".`);
    }
});

interface BundlerArgs {
    Config: Config;
    Joiner: Bundlers;
    BundleResultsCb?: (results: Map<string, Vinyl[]>) => void;
}

/**
 * Creates bundler and data source stream.
 * @param args Arguments to be passed to bundler.
 * @param streamContents Objects to be feed into bundler via stream.
 */
function createBundler(args: BundlerArgs, streamContents: any[]): Stream {
    // Create bundler
    const bundler = new Bundler(args.Config, args.Joiner, args.BundleResultsCb);

    // Build source stream
    const stream = new Readable({
        objectMode: true,
        read: function() {
            for (const chunk of streamContents) {
                this.push(chunk);
            }
            this.push(null);
        }
    });

    // Assemble stream and return
    return stream
        .pipe(bundler);
}

/**
 * Helper class that builds bundler and verifies stream output.
 * @param t Execution context used for test.
 * @param args Arguments passed to bundler.
 * @param streamContents Objects to be feed into bundler via stream.
 * @param expected Expected result, order insensitive.
 */
async function testBundlerResults(t: ExecutionContext, args: BundlerArgs, streamContents: any[], expected: any) {
    // Create bundler
    const bundler = createBundler(args, streamContents);

    // Create catcher (so we can see what the results are)
    const catcher = new Catcher(() => {});

    // Run bundler
    bundler
        .pipe(catcher);

    // Inspect results
    t.deepEqual((await catcher.Collected).sort(), expected.sort());
}

/**
 * Returns a promise that will hoist bundler exceptions into an accessible scope.
 * @param args Arguments passed to bundler.
 * @param streamContents Objects to be feed into bundler via stream.
 */
function bundlerExceptionHoist(args: BundlerArgs, streamContents: any[]): Promise<undefined> {
    return new Promise<undefined>((resolve, reject) => {
        // Create bundler
        const bundler = createBundler(args, streamContents);

        // Create catcher (so we can detect completion)
        const catcher = new Catcher(() => {});

        // Run bundler
        bundler
            .on("error", (e) => {
                reject(e)
            })
            .pipe(catcher)
            .on("error", (e) => {
                reject(e)
            });

        catcher.Collected.then(() => {
            resolve();
        });
    })
}
