import { DatabaseAdapter, OtpRecord, OtpChannel } from '../../types';
import mongoose, { Model, Document } from 'mongoose';

// Mongoose Schema for OTP
const otpSchema = new mongoose.Schema({
  email: { type: String, index: true },
  phone: { type: String, index: true },
  context: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  channel: { type: String, required: true, enum: ['email', 'sms'], index: true },
  otpHash: { type: String, required: true },
  hmac: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
  maxAttempts: { type: Number, default: 5 },
  isUsed: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  requestMeta: {
    ip: { type: String, required: true },
    userAgent: { type: String, required: true },
    deviceId: String,
    platform: String,
    browser: String,
    os: String,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Create compound indexes for better performance
otpSchema.index({ channel: 1, context: 1, sessionId: 1 }, { unique: true });
otpSchema.index({ email: 1, context: 1, sessionId: 1 }); // Backward compatibility
otpSchema.index({ channel: 1, context: 1, expiresAt: 1 });
otpSchema.index({ email: 1, context: 1, expiresAt: 1 }); // Backward compatibility
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Interface for the Mongoose document
interface OtpDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;

  context: string;
  sessionId: string;
  channel: OtpChannel;
  otpHash: string;
  hmac: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  isLocked: boolean;
  requestMeta: {
    ip: string;
    userAgent: string;
    deviceId?: string;
    platform?: string;
    browser?: string;
    os?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface MongooseConfig {
  connection: mongoose.Connection;
  collectionName?: string;
}

export class MongooseAdapter implements DatabaseAdapter {
  private model: Model<OtpDocument>;

  constructor(config: MongooseConfig) {
    const collectionName = config.collectionName || 'otps';
    
    // Create or get the model
    this.model = config.connection.model<OtpDocument>(
      'Otp',
      otpSchema,
      collectionName
    );
  }

  async createOtp(otp: Omit<OtpRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OtpRecord> {
    const otpDoc = new this.model(otp);
    const savedDoc = await otpDoc.save();
    
    return this.mapDocumentToOtpRecord(savedDoc);
  }

  async findOtp(email: string, context: string, sessionId: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const doc = await this.model.findOne({
      email,
      channel,
      context,
      sessionId,
    });

    return doc ? this.mapDocumentToOtpRecord(doc) : null;
  }

  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = updates;
    
    const updatedDoc = await this.model.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error(`OTP with id ${id} not found`);
    }

    return this.mapDocumentToOtpRecord(updatedDoc);
  }

  async deleteOtp(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id);
  }

  async findActiveOtp(email: string, context: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const doc = await this.model.findOne({
      email,
      channel,
      context,
      expiresAt: { $gt: new Date() },
      isUsed: false,
      isLocked: false,
    }).sort({ createdAt: -1 }); // Get the most recent active OTP

    return doc ? this.mapDocumentToOtpRecord(doc) : null;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.model.deleteMany({
      expiresAt: { $lte: new Date() },
    });
  }

  private mapDocumentToOtpRecord(doc: OtpDocument): OtpRecord {
    return {
      id: doc._id.toString(),
      email: doc.email,
      context: doc.context,
      sessionId: doc.sessionId,
      channel: doc.channel,
      otpHash: doc.otpHash,
      hmac: doc.hmac,
      expiresAt: doc.expiresAt,
      attempts: doc.attempts,
      maxAttempts: doc.maxAttempts,
      isUsed: doc.isUsed,
      isLocked: doc.isLocked,
      requestMeta: doc.requestMeta,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
