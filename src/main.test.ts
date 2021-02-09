import { BundleOrchestrator } from "@userfrosting/gulp-bundle-assets";
import BundleOrchestratorDefault from "@userfrosting/gulp-bundle-assets";
import test from "ava";

test("Validate exports", t => {
    t.assert(typeof BundleOrchestrator === "function", "Named export is wrong type");
    t.assert(typeof BundleOrchestratorDefault === "function", "Default export is wrong type");
});
