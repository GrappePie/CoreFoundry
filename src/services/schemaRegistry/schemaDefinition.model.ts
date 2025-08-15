import mongoose, { Schema, models } from 'mongoose';

export interface ISchemaDefinition {
  schemaId: string;
  version: string;
  schema: Record<string, any>;
}

const SchemaDefinitionSchema = new Schema<ISchemaDefinition>({
  schemaId: { type: String, required: true },
  version: { type: String, required: true },
  schema: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

SchemaDefinitionSchema.index({ schemaId: 1, version: 1 }, { unique: true });

export default models.SchemaDefinition || mongoose.model<ISchemaDefinition>('SchemaDefinition', SchemaDefinitionSchema);
