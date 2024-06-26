<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@userfrosting/gulp-bundle-assets](./gulp-bundle-assets.md) &gt; [BundleOrchestrator](./gulp-bundle-assets.bundleorchestrator.md) &gt; [\_transform](./gulp-bundle-assets.bundleorchestrator._transform.md)

## BundleOrchestrator.\_transform() method

Collects copies of applicable files to later bundle.

**Signature:**

```typescript
_transform(chunk: any, encoding: BufferEncoding, callback: TransformCallback): Promise<void>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  chunk | any | Stream chunk, may be a Vinyl object. |
|  encoding | BufferEncoding | Encoding of chunk, if applicable. |
|  callback | TransformCallback | Callback to indicate processing is completed. |

**Returns:**

Promise&lt;void&gt;

