import Ajv, { JSONSchemaType } from 'ajv';
import SchemaDefinition from '../services/schemaRegistry/schemaDefinition.model';

export interface ModuleManifest {
  name: string;
  version: string;
  description?: string;
  endpoints: {
    rest: string;
    ws?: string;
  };
  schemas: Record<string, any>;
  dependencies?: string[];
  events?: {
    publish?: string[];
    subscribe?: string[];
  };
}

// JSON Schema definition describing the shape of a module manifest.
// The schema is used by AJV to validate manifests at runtime and lists
// all required fields along with optional ones like `dependencies` or
// `events`.
const manifestSchema: JSONSchemaType<ModuleManifest> = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    description: { type: 'string', nullable: true },
    endpoints: {
      type: 'object',
      properties: {
        rest: { type: 'string' },
        ws: { type: 'string', nullable: true },
      },
      required: ['rest'],
      additionalProperties: false,
    },
    schemas: { type: 'object', additionalProperties: true },
    dependencies: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
    events: {
      type: 'object',
      properties: {
        publish: { type: 'array', items: { type: 'string' }, nullable: true },
        subscribe: { type: 'array', items: { type: 'string' }, nullable: true },
      },
      additionalProperties: false,
      nullable: true,
    },
  },
  required: ['name', 'version', 'endpoints', 'schemas'],
  additionalProperties: false,
};

// Configure AJV to collect all validation errors instead of stopping after the
// first one. This produces more actionable feedback for developers.
const ajv = new Ajv({ allErrors: true });

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
export const validateManifest = ajv.compile(manifestSchema);

export async function approveManifest(manifest: ModuleManifest): Promise<boolean> {
  const valid = validateManifest(manifest);
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
      await SchemaDefinition.updateOne(
        { schemaId: schema.$id, version: manifest.version },
        { schemaId: schema.$id, version: manifest.version, schema },
        { upsert: true }
      );
    }
  }
  return mismatch ? false : true;
}
