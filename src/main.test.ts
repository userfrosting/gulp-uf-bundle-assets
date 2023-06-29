import { BundleOrchestrator, mergeConfigs, validateConfig } from "@userfrosting/gulp-bundle-assets";
import test from "ava";

test("Validate exports", t => {
    t.assert(typeof BundleOrchestrator === "function", "BundleOrchestrator named export is wrong type");
    t.assert(typeof mergeConfigs === "function", "MergeRawConfigs named export is wrong type");
    t.assert(typeof validateConfig === "function", "ValidateRawConfig named export is wrong type");
});
