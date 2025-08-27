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
  expiresAt: { 
    type: Date, 
    required: true, 
    index: true,
    validate: {
      validator: function(value: Date) {
        return value instanceof Date && !isNaN(value.getTime());
      },
      message: 'expiresAt must be a valid date'
    }
  },
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
    try {
      // Ensure expiresAt is a valid Date object
      const otpData = {
        ...otp,
        expiresAt: this.ensureValidDate(otp.expiresAt)
      };
      
      console.log('Creating OTP with expiresAt:', otpData.expiresAt, 'Type:', typeof otpData.expiresAt);
      
      const otpDoc = new this.model(otpData);
      const savedDoc = await otpDoc.save();
      
      return this.mapDocumentToOtpRecord(savedDoc);
    } catch (error) {
      console.error('Error creating OTP:', error);
      console.error('OTP data:', JSON.stringify(otp, null, 2));
      throw error;
    }
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
    
    // Ensure expiresAt is a valid Date object if it's being updated
    if (updateData.expiresAt) {
      updateData.expiresAt = this.ensureValidDate(updateData.expiresAt);
    }
    
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

  /**
   * Ensure that the provided value is a valid Date object
   * @param dateValue - The date value to validate
   * @returns A valid Date object
   */
  private ensureValidDate(dateValue: Date | string | number): Date {
    // If it's already a valid Date object, return it
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    
    // If it's a string or number, try to create a new Date
    const newDate = new Date(dateValue);
    
    // Check if the new date is valid
    if (isNaN(newDate.getTime())) {
      throw new Error(`Invalid date value: ${dateValue}. Cannot convert to valid Date object.`);
    }
    
    return newDate;
  }
}
