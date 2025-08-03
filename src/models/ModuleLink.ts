import mongoose, { Schema, Document, Types, models } from 'mongoose';
import Ajv, { AnySchema } from 'ajv';
import mongoosePaginate from 'mongoose-paginate-v2';

const ajv = new Ajv();

export interface IModuleLink extends Document {
  fromModule: Types.ObjectId;
  toModule: Types.ObjectId;
  mappingRules: any;
  status: 'active' | 'inactive';
  lastExecution?: Date;
  executionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ModuleLinkSchema: Schema = new Schema({
  fromModule: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  toModule: { type: Schema.Types.ObjectId, ref: 'Module', required: true },
  mappingRules: { type: Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastExecution: Date,
  executionCount: { type: Number, default: 0 },
  deletedAt: Date,
}, { timestamps: true });

// Validate mappingRules schema
ModuleLinkSchema.pre('save', function(next) {
  if (!ajv.validateSchema(this.mappingRules as AnySchema)) {
    return next(new Error('Invalid mappingRules schema: ' + ajv.errorsText(ajv.errors)));
  }
  next();
});

// Plugins
ModuleLinkSchema.plugin(mongoosePaginate);

// Indexes
ModuleLinkSchema.index({ fromModule: 1 });
ModuleLinkSchema.index({ toModule: 1 });
ModuleLinkSchema.index({ deletedAt: 1 });

export default models.ModuleLink || mongoose.model<IModuleLink>('ModuleLink', ModuleLinkSchema);
