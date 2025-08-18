"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateManifest = void 0;
exports.approveManifest = approveManifest;
const ajv_1 = __importDefault(require("ajv"));
const schemaDefinition_model_1 = __importDefault(require("../services/schemaRegistry/schemaDefinition.model"));
const moduleManifestSchema_1 = require("./moduleManifestSchema");
// Configure AJV to collect all validation errors instead of stopping after the
// first one. This produces more actionable feedback for developers.
const ajv = new ajv_1.default({ allErrors: true });
/**
 * Validates a candidate manifest object against the JSON schema defined above.
 *
 * The returned function follows AJV's {@link import('ajv').AnyValidateFunction}
 * signature: it returns `true` when the manifest conforms to the schema and
 * `false` otherwise. When validation fails, callers can inspect
 * `validateManifest.errors` to obtain a detailed list of
 * {@link import('ajv').ErrorObject} items describing each problem, such as
 * missing required fields, invalid types or unexpected properties.
 *
 * Each error object includes an `instancePath` (JSON Pointer to the offending
 * field) and a human‑readable `message`. For a friendlier UX, transform these
 * objects into concise strings before exposing them to module authors:
 *
 * ```ts
 * if (!validateManifest(manifest)) {
 *   const messages = (validateManifest.errors ?? []).map(
 *     (err) => `${err.instancePath || err.params.missingProperty}: ${err.message}`,
 *   );
 *   console.error('Invalid manifest:\n' + messages.join('\n'));
 * }
 * ```
 *
 * `ajv.errorsText(validateManifest.errors)` can also generate a summary
 * message. Presenting distilled messages instead of raw AJV objects helps keep
 * validation feedback actionable.
 */
exports.validateManifest = ajv.compile(moduleManifestSchema_1.moduleManifestSchema);
async function approveManifest(manifest) {
    const valid = (0, exports.validateManifest)(manifest);
    if (!valid) {
        return false;
    }
    const schemas = Object.entries(manifest.schemas || {});
    let mismatch = false;
    for (const [key, schema] of schemas) {
        if (schema.$id) {
            if (key !== schema.$id) {
                mismatch = true;
                console.warn(`Schema key "${key}" does not match $id "${schema.$id}"`);
            }
            await schemaDefinition_model_1.default.updateOne({ schemaId: schema.$id, version: manifest.version }, { schemaId: schema.$id, version: manifest.version, schema }, { upsert: true });
        }
    }
    return mismatch ? false : true;
}
