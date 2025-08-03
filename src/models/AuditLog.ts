import mongoose, { Schema, Document, models } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: string;
  payload: any;
  result: 'success' | 'failure';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  moduleId?: mongoose.Types.ObjectId;
  endpoint?: string;
  errorCode?: string;
  errorStack?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  payload: { type: Schema.Types.Mixed },
  result: { type: String, enum: ['success', 'failure'], required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  userAgent: String,
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module' },
  endpoint: String,
  errorCode: String,
  errorStack: String,
}, { timestamps: true });

// Indexes for querying logs quickly
AuditLogSchema.index({ userId: 1 });
AuditLogSchema.index({ timestamp: -1 });

// Pagination plugin
AuditLogSchema.plugin(mongoosePaginate);

// TTL index to expire logs after 30 days
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export default models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
