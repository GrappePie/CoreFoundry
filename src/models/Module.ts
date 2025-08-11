import mongoose, { Schema, Document, models } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ModuleManifest, approveManifest } from '../lib/moduleManifest';

export interface IModule extends Document {
  name: string;
  version: string;
  description: string;
  ownerId: mongoose.Types.ObjectId;
  manifest: ModuleManifest;
  endpoints: {
    rest: string;
    ws?: string;
  };
}

const ModuleSchema: Schema = new Schema({
  name: { type: String, required: true },
  version: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  manifest: { type: Schema.Types.Mixed, required: true },
  endpoints: {
    rest: { type: String, required: true },
    ws: { type: String },
  },
  deletedAt: Date,
}, { timestamps: true });

// Validate module manifest
ModuleSchema.pre('save', async function(next) {
  if (!(await approveManifest(this.manifest as ModuleManifest))) {
    return next(new Error('Invalid module manifest'));
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
