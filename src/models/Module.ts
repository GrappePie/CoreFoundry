import mongoose, { Schema, Document, models } from 'mongoose';
import Ajv, { AnySchema } from 'ajv';
import mongoosePaginate from 'mongoose-paginate-v2';

const ajv = new Ajv();

export interface IModule extends Document {
  name: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  schema: any;
  endpoints: {
    rest: string;
    ws?: string;
  };
}

const ModuleSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  schema: { type: Schema.Types.Mixed, required: true },
  endpoints: {
    rest: { type: String, required: true },
    ws: { type: String },
  },
  deletedAt: Date,
}, { timestamps: true });

// Validate JSON Schema
ModuleSchema.pre('save', function(next) {
  if (!ajv.validateSchema(this.schema as AnySchema)) {
    return next(new Error('Invalid module JSON Schema: ' + ajv.errorsText(ajv.errors)));
  }
  next();
});

// Plugins
ModuleSchema.plugin(mongoosePaginate);

// Indexes
ModuleSchema.index({ ownerId: 1 });
ModuleSchema.index({ name: 1 });
ModuleSchema.index({ deletedAt: 1 });

export default models.Module || mongoose.model<IModule>('Module', ModuleSchema);
