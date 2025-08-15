import { JSONSchemaType } from 'ajv';

export interface ModuleManifest {
  name: string;
  version: string;
  endpoints: {
    rest: string;
    ws?: string;
  };
  events?: {
    publish?: string[];
    subscribe?: string[];
  };
  schemas: Record<string, any>;
  dependencies?: string[];
  description?: string;
}

export const moduleManifestSchema: JSONSchemaType<ModuleManifest> = {
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
    events: {
      type: 'object',
      properties: {
        publish: { type: 'array', items: { type: 'string' }, nullable: true },
        subscribe: { type: 'array', items: { type: 'string' }, nullable: true },
      },
      additionalProperties: false,
      nullable: true,
    },
    schemas: { type: 'object', additionalProperties: true },
    dependencies: {
      type: 'array',
      items: { type: 'string' },
      nullable: true,
    },
  },
  required: ['name', 'version', 'endpoints', 'schemas'],
  additionalProperties: false,
};

