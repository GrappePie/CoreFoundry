import mongoose, { Schema, Document, models } from 'mongoose';
import bcrypt from 'bcryptjs';
import mongoosePaginate from 'mongoose-paginate-v2';

export interface IUser extends Document {
  email: string;
  password?: string;
  role: 'owner' | 'employee' | 'admin';
  subscription: 'free' | 'pro' | 'enterprise';
  modulesEnabled: mongoose.Types.ObjectId[];
  lastLogin?: Date;
  emailVerified: boolean;
  status: 'active' | 'blocked';
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email.'],
    unique: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password.'],
    select: false, // Do not return password by default
  },
  role: {
    type: String,
    enum: ['owner', 'employee', 'admin'],
    required: true,
    default: 'employee',
  },
  subscription: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
  },
  modulesEnabled: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
  lastLogin: Date,
  emailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  subscriptionStart: Date,
  subscriptionEnd: Date,
  deletedAt: Date,
}, { timestamps: true });

// Hooks
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Methods
UserSchema.methods.comparePassword = function(candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

// toJSON transform
UserSchema.set('toJSON', {
  transform(doc, ret) {
    delete (ret as any).password;
    delete (ret as any).__v;
    return ret;
  }
});

// Plugins and indexes
UserSchema.plugin(mongoosePaginate);
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ subscription: 1 });
UserSchema.index({ modulesEnabled: 1 });
UserSchema.index({ deletedAt: 1 });

export default models.User || mongoose.model<IUser>('User', UserSchema);
