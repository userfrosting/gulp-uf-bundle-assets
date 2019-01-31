import { BundlesProcessor } from "./bundles-processor";
import test, { ExecutionContext } from "ava";
import Vinyl from "vinyl";
import { BundlerStreamFactory } from "./main";
import { Transform, TransformCallback, Readable } from "stream";

test("BundlesProcessor with iterable inputs empty", async t => {
    const files: Map<string, [Vinyl, number]> = new Map();
    const bundles: Map<string, string[]> = new Map();

    TestBundler(t, [[], new Map()], await BundlesProcessor(files, bundles, BundleStreamFactory, () => {}));
});

test("BundlesProcessor with files but no bundles", async t => {
    const files: Map<string, [Vinyl, number]> = new Map();
    files.set("test", [MakeVinyl("test", "test"), 0]);
    const bundles: Map<string, string[]> = new Map();

    TestBundler(t, [[], new Map()], await BundlesProcessor(files, bundles, BundleStreamFactory, () => {}));
});

test("BundlesProcessor with files and bundles", async t => {
    const files: Map<string, [Vinyl, number]> = new Map();
    files.set("test", [MakeVinyl("test", "test"), 0]);
    const bundles: Map<string, string[]> = new Map();
    bundles.set("test", ["test"]);

    const resultChunks: any[] = [
        MakeVinyl("test", "test")
    ];
    const resultPaths: Map<string, Vinyl[]> = new Map();
    resultPaths.set("test", [new Vinyl({contents: null, path: "test"})]);

    TestBundler(t, [resultChunks, resultPaths], await BundlesProcessor(files, bundles, BundleStreamFactory, () => {}));
});

test("BundlesProcessor with bundles that will never be satisfied", async t => {
    const files: Map<string, [Vinyl, number]> = new Map();
    files.set("test2", [MakeVinyl("test", "test"), 0]);
    const bundles: Map<string, string[]> = new Map();
    bundles.set("test", ["test"]);

    await t.throwsAsync(() => BundlesProcessor(files, bundles, BundleStreamFactory, () => {}), 'No file could be resolved for "test".');
});

test("BundlesProcessor with non-Vinyl chunks emitted by bundle factory", async t => {
    class TestNonVinylTransform extends TestTransform {
        _transform(chunk: any, encoding: string, callback: TransformCallback): void {
            this.push(chunk);
            this.push("what's a vinyl?");
            callback();
        }
    }

    const NonVinylBundleStreamFactory: BundlerStreamFactory = (src: Readable): Transform => {
        return src.pipe(new TestNonVinylTransform());
    };

    const files: Map<string, [Vinyl, number]> = new Map();
    files.set("test", [MakeVinyl("test", "test"), 0]);
    const bundles: Map<string, string[]> = new Map();
    bundles.set("test", ["test"]);

    const resultChunks: any[] = [
        MakeVinyl("test", "test"),
        "what's a vinyl?"
    ];
    const resultPaths: Map<string, Vinyl[]> = new Map();
    resultPaths.set("test", [new Vinyl({contents: null, path: "test"})]);

    TestBundler(t, [resultChunks, resultPaths], await BundlesProcessor(files, bundles, NonVinylBundleStreamFactory, () => {}));
});

// TODO Handle exception block in bundles process - promise (if not already)
test("BundlesProcessor with bundle factory that generates errors (before piping)", async t => {
    const ErrorBundleStreamFactory: BundlerStreamFactory = (src: Readable): Transform => {
        throw new Error("RIP");
    };

    const files: Map<string, [Vinyl, number]> = new Map();
    files.set("test", [MakeVinyl("test", "test"), 0]);
    const bundles: Map<string, string[]> = new Map();
    bundles.set("test", ["test"]);

    await t.throwsAsync(() => BundlesProcessor(files, bundles, ErrorBundleStreamFactory, () => {}), "RIP");
});

function TestBundler(t: ExecutionContext, expected: [any[], Map<string, Vinyl[]>], actual: [any[], Map<string, Vinyl[]>]): void {
    // Check result chunks (order insensitive)
    t.deepEqual(expected[0].sort(), actual[0].sort());

    // Sort result paths
    expected[1].forEach(paths => paths.sort());
    actual[1].forEach(paths => paths.sort());

    // Check result paths
    t.deepEqual(expected[1], actual[1]);
}

/**
 * Simple stub for testing purposes
 */
class TestTransform extends Transform {
    constructor() {
        super({ objectMode: true });

    }

    _transform(chunk: any, encoding: string, callback: TransformCallback): void {
        this.push(chunk);
        callback();
    }
}

/**
 * Makes an extended Vinyl object. For testing purposes.
 * @param contents Contents used to make buffer.
 * @param path Path of file.
 */
function MakeVinyl(contents: string, path: string): Vinyl {
    return new Vinyl({
        contents: Buffer.from(contents),
        path
    });
}

const BundleStreamFactory: BundlerStreamFactory = (src: Readable): Transform => {
    return src.pipe(new TestTransform());
};
