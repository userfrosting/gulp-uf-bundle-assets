<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@userfrosting/gulp-bundle-assets](./gulp-bundle-assets.md) &gt; [CollisionReactions](./gulp-bundle-assets.collisionreactions.md)

## CollisionReactions enum

Rules for how a bundle collision may be treated.

**Signature:**

```typescript
export declare enum CollisionReactions 
```

## Enumeration Members

|  Member | Value | Description |
|  --- | --- | --- |
|  error | <code>3</code> | Throw an error on encountering an already defined bundle. |
|  ignore | <code>2</code> | Leave the existing bundle alone. |
|  merge | <code>1</code> | Merge with the existing bundle, with order preserved as much as possible. Colliding arrays will be prepended to the existing, keep an eye out for duplicates. |
|  replace | <code>0</code> | Replace the existing bundle. |

