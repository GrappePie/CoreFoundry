import Ajv, { JSONSchemaType } from 'ajv';

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

const ajv = new Ajv({ allErrors: true });

export const validateManifest = ajv.compile(manifestSchema);
