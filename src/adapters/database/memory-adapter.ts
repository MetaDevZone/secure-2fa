import { DatabaseAdapter, OtpRecord, OtpChannel } from '../../types';

export class MemoryDatabaseAdapter implements DatabaseAdapter {
  private otps: Map<string, OtpRecord> = new Map();

  async createOtp(otp: Omit<OtpRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OtpRecord> {
    const id = this.generateId();
    const now = new Date();
    
    const otpRecord: OtpRecord = {
      ...otp,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.otps.set(id, otpRecord);
    return otpRecord;
  }

  async findOtp(email: string, context: string, sessionId: string, channel: OtpChannel): Promise<OtpRecord | null> {
    for (const otp of this.otps.values()) {
      if (otp.channel === channel && 
          otp.context === context && 
          otp.sessionId === sessionId &&
          otp.email === email) {
        return otp;
      }
    }
    return null;
  }

  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    const otp = this.otps.get(id);
    if (!otp) {
      throw new Error(`OTP with id ${id} not found`);
    }

    const updatedOtp: OtpRecord = {
      ...otp,
      ...updates,
      updatedAt: new Date(),
    };

    this.otps.set(id, updatedOtp);
    return updatedOtp;
  }

  async deleteOtp(id: string): Promise<void> {
    this.otps.delete(id);
  }

  async findActiveOtp(email: string, context: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const now = new Date();
    
    for (const otp of this.otps.values()) {
      if (
        otp.channel === channel &&
        otp.context === context &&
        !otp.isUsed &&
        !otp.isLocked &&
        otp.expiresAt > now &&
        otp.email === email
      ) {
        return otp;
      }
    }
    return null;
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    const expiredIds: string[] = [];

    for (const [id, otp] of this.otps.entries()) {
      if (otp.expiresAt < now) {
        expiredIds.push(id);
      }
    }

    expiredIds.forEach(id => this.otps.delete(id));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  // Helper method for testing
  clear(): void {
    this.otps.clear();
  }
}
