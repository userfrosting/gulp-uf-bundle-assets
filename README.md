# [gulp](https://github.com/gulpjs/gulp)-bundle-assets

| Branch | Status |
| ------ | ------ |
| master | [![Continuous Integration](https://github.com/userfrosting/gulp-uf-bundle-assets/workflows/Continuous%20Integration/badge.svg?branch=master)](https://github.com/userfrosting/gulp-uf-bundle-assets/actions?query=branch:master+workflow:"Continuous+Integration") [![codecov](https://codecov.io/gh/userfrosting/gulp-uf-bundle-assets/branch/master/graph/badge.svg)](https://codecov.io/gh/userfrosting/gulp-uf-bundle-assets/branch/master) |

Orchestrates JS and CSS bundle creation in an efficient and configurable manner.

## Install

```bash
npm i -D  @userfrosting/gulp-bundle-assets
```

## Usage

> **IMPORTANT**<br/>
> This is an ES module package targeting NodeJS `>=14.0.0`, refer to the [NodeJS ESM docs](https://nodejs.org/api/esm.html) regarding how to correctly import.
> ESM loaders like `@babel/loader` or `esm` likely won't work as expected.

```js
// gulpfile.mjs
import AssetBundler from "@userfrosting/gulp-bundle-assets";
import Gulp from "gulp";
import cleanCss from "gulp-clean-css";
import concatCss from "gulp-concat-css";
import uglify from "gulp-uglify";
import concatJs from "gulp-concat-js";

export function bundle() {
    const config = {
        bundle: {
            example: {
                scripts: [
                    "foo.js",
                    "bar.js"
                ],
                styles: [
                    "foo.css",
                    "bar.css"
                ]
            }
        }
    };
    const joiner = {
        Scripts(bundleStream, name) {
            return bundleStream
                .pipe(concatJs(name + ".js"))// example.js
                .pipe(uglify());
        },
        Styles(bundleStream, name) {
            return bundleStream
                .pipe(concatCss(name + ".css"))// example.css
                .pipe(cleanCss());
        }
    };

    return Gulp.src("src/**")
        .pipe(new AssetBundler(config, joiner))
        .pipe(Gulp.dest("public/assets/"));
}
```

```bash
$ gulp bundle
```

## Integrating bundles into your app

A results callback can be provided as a third parameter. On completion, it will be provided with a mapping for bundles to their respective virtual file paths. Note that path transformations performed after the bundler (including `dest`) won't be reflected and should be accounted for.

The "DIY" approach to bundle resulting mapping is used to permit deeper integration with any system, such as generating a file in the target language to decrease integration cost.

## API

See [docs/api](./docs/api/index.md).

## Origins

This plugin was originally forked from [gulp-bundle-assets](https://github.com/dowjones/gulp-bundle-assets) to fix a CSS import bug. It has since undergone numerous refactors to improve performance and flexibility.

## License

[MIT](LICENSE)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
