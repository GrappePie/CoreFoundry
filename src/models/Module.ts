import mongoose, { Schema, Document, models } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ModuleManifest } from '../lib/moduleManifestSchema';
import { approveManifest } from '../lib/moduleManifest';

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
  /** Token utilizado para autenticar integraciones entre módulos. */
  integrationToken: string;
  manifestHistory?: {
    version: string;
    manifest: ModuleManifest;
    createdAt: Date;
  }[];
  /** Scopes granted to this module for API authorization checks. */
  scopes: string[];
  status: 'online' | 'offline';
  lastHandshake?: Date;
  compatibleVersion: boolean;
}

const ModuleSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    version: { type: String, required: true },
    description: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    manifest: { type: Schema.Types.Mixed, required: true },
    manifestHistory: {
      type: [
        {
          version: { type: String, required: true },
          manifest: { type: Schema.Types.Mixed, required: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    endpoints: {
      rest: { type: String, required: true },
      ws: { type: String },
    },
    integrationToken: { type: String, required: true },
    scopes: { type: [String], default: [] },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastHandshake: Date,
    compatibleVersion: { type: Boolean, default: false },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Validate module manifest
ModuleSchema.pre('save', async function (next) {
  const doc = this as unknown as IModule;
  if (!(await approveManifest(doc.manifest as ModuleManifest))) {
    return next(new Error('Invalid module manifest'));
  }
  if (!doc.manifestHistory) {
    doc.manifestHistory = [];
  }
  const exists = doc.manifestHistory.some(
    (m) => m.version === doc.version
  );
  if (!exists) {
    doc.manifestHistory.push({
      version: doc.version,
      manifest: doc.manifest,
      createdAt: new Date(),
    });
  }
  next();
});

// Plugins
ModuleSchema.plugin(mongoosePaginate);

// Indexes
ModuleSchema.index({ ownerId: 1 });
ModuleSchema.index({ name: 1 });
ModuleSchema.index({ deletedAt: 1 });

export default (models.Module as mongoose.Model<IModule>) ||
  mongoose.model<IModule>('Module', ModuleSchema);
