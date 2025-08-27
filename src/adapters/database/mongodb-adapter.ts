import { DatabaseAdapter, OtpRecord, OtpChannel } from '../../types';
import { Collection, Db, MongoClient } from 'mongodb';

export interface MongoDbConfig {
  client: MongoClient;
  dbName: string;
  collectionName?: string;
}

export class MongoDbAdapter implements DatabaseAdapter {
  private db: Db;
  private collection: Collection<any>;

  constructor(config: MongoDbConfig) {
    this.db = config.client.db(config.dbName);
    this.collection = this.db.collection(config.collectionName || 'otps');
    
    // Create indexes for better performance
    this.createIndexes();
  }

  private async createIndexes(): Promise<void> {
    try {
      // Index for finding OTPs by channel, context, and sessionId
      await this.collection.createIndex(
        { channel: 1, context: 1, sessionId: 1 },
        { name: 'channel_context_session_idx' }
      );

      // Index for finding OTPs by email, context, and sessionId (backward compatibility)
      await this.collection.createIndex(
        { email: 1, context: 1, sessionId: 1 },
        { name: 'email_context_session_idx' }
      );



      // Index for finding active OTPs by channel, context, and expiry
      await this.collection.createIndex(
        { channel: 1, context: 1, expiresAt: 1 },
        { name: 'channel_context_expiry_idx' }
      );

      // Index for finding active OTPs by email and context (backward compatibility)
      await this.collection.createIndex(
        { email: 1, context: 1, expiresAt: 1 },
        { name: 'email_context_expiry_idx' }
      );



      // TTL index for automatic cleanup of expired OTPs
      await this.collection.createIndex(
        { expiresAt: 1 },
        { expireAfterSeconds: 0, name: 'ttl_expiry_idx' }
      );

      // Index for cleanup operations
      await this.collection.createIndex(
        { expiresAt: 1 },
        { name: 'expiry_cleanup_idx' }
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create indexes:', error);
    }
  }

  async createOtp(otp: Omit<OtpRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OtpRecord> {
    const now = new Date();
    const otpRecord = {
      ...otp,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(otpRecord);
    
    return {
      ...otpRecord,
      id: result.insertedId.toString(),
    };
  }

  async findOtp(email: string, context: string, sessionId: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const query: any = {
      email,
      channel,
      context,
      sessionId,
    };

    const doc = await this.collection.findOne(query);

    return doc ? this.mapDocumentToOtpRecord(doc) : null;
  }

  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    const { ObjectId } = await import('mongodb');
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _createdAt, ...updateData } = updates;
    
    const result = await this.collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      throw new Error(`OTP with id ${id} not found`);
    }

    return this.mapDocumentToOtpRecord(result);
  }

  async deleteOtp(id: string): Promise<void> {
    const { ObjectId } = await import('mongodb');
    
    await this.collection.deleteOne({ _id: new ObjectId(id) });
  }

  async findActiveOtp(email: string, context: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const query: any = {
      email,
      channel,
      context,
      expiresAt: { $gt: new Date() },
      isUsed: false,
      isLocked: false,
    };

    const doc = await this.collection.findOne(query);

    return doc ? this.mapDocumentToOtpRecord(doc) : null;
  }

  async cleanupExpiredOtps(): Promise<void> {
    await this.collection.deleteMany({
      expiresAt: { $lte: new Date() },
    });
  }

  async cleanupConflictingOtps(email: string, context: string, channel: OtpChannel): Promise<void> {
    // Find all OTPs for this email/context/channel combination
    const conflictingOtps = await this.collection.find({
      email,
      context,
      channel,
    }).toArray();

    if (conflictingOtps.length > 1) {
      // Keep only the most recent one, delete the rest
      const sortedOtps = conflictingOtps.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const otpsToDelete = sortedOtps.slice(1); // All except the most recent
      const idsToDelete = otpsToDelete.map(otp => otp._id);
      
      if (idsToDelete.length > 0) {
        await this.collection.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`Cleaned up ${idsToDelete.length} conflicting OTPs for ${email}:${context}`);
      }
    }
  }

  private mapDocumentToOtpRecord(doc: any): OtpRecord {
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
