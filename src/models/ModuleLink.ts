import mongoose, { Schema, Document, Types, models } from 'mongoose';

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
}, { timestamps: true });

// Indexes
ModuleLinkSchema.index({ fromModule: 1 });
ModuleLinkSchema.index({ toModule: 1 });

export default models.ModuleLink || mongoose.model<IModuleLink>('ModuleLink', ModuleLinkSchema);
