import { BundleOrchestrator, MergeRawConfigs, ValidateRawConfig } from "@userfrosting/gulp-bundle-assets";
import BundleOrchestratorDefault from "@userfrosting/gulp-bundle-assets";
import test from "ava";

test("Validate exports", t => {
    t.assert(typeof BundleOrchestrator === "function", "BundleOrchestrator named export is wrong type");
    t.assert(typeof BundleOrchestratorDefault === "function", "Default export is wrong type");
    t.assert(typeof MergeRawConfigs === "function", "MergeRawConfigs named export is wrong type");
    t.assert(typeof ValidateRawConfig === "function", "ValidateRawConfig named export is wrong type");
});
