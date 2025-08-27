import { DatabaseAdapter, OtpRecord, RequestMeta, OtpChannel } from '../../types';

export interface PrismaClient {
  otp: {
    create: (data: any) => Promise<any>;
    findUnique: (params: any) => Promise<any>;
    findFirst: (params: any) => Promise<any>;
    findMany: (params: any) => Promise<any[]>;
    update: (params: any) => Promise<any>;
    delete: (params: any) => Promise<any>;
    deleteMany: (params: any) => Promise<any>;
  };
}

export class PrismaDatabaseAdapter implements DatabaseAdapter {
  constructor(private prisma: PrismaClient) {}

  async createOtp(otp: Omit<OtpRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<OtpRecord> {
    const now = new Date();
    
    const createdOtp = await this.prisma.otp.create({
      data: {
        email: otp.email,
        context: otp.context,
        sessionId: otp.sessionId,
        channel: otp.channel,
        otpHash: otp.otpHash,
        hmac: otp.hmac,
        expiresAt: otp.expiresAt,
        attempts: otp.attempts,
        maxAttempts: otp.maxAttempts,
        isUsed: otp.isUsed,
        isLocked: otp.isLocked,
        requestMeta: otp.requestMeta,
        createdAt: now,
        updatedAt: now,
      },
    });

    return this.mapPrismaToOtpRecord(createdOtp);
  }

  async findOtp(email: string, context: string, sessionId: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const otp = await this.prisma.otp.findFirst({
      where: {
        email,
        channel,
        context,
        sessionId,
      },
    });

    return otp ? this.mapPrismaToOtpRecord(otp) : null;
  }

  async updateOtp(id: string, updates: Partial<OtpRecord>): Promise<OtpRecord> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...updateData } = updates;
    
    const updatedOtp = await this.prisma.otp.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    return this.mapPrismaToOtpRecord(updatedOtp);
  }

  async deleteOtp(id: string): Promise<void> {
    await this.prisma.otp.delete({
      where: { id },
    });
  }

  async findActiveOtp(email: string, context: string, channel: OtpChannel): Promise<OtpRecord | null> {
    const now = new Date();
    
    const otp = await this.prisma.otp.findFirst({
      where: {
        email,
        channel,
        context,
        isUsed: false,
        isLocked: false,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return otp ? this.mapPrismaToOtpRecord(otp) : null;
  }

  async cleanupExpiredOtps(): Promise<void> {
    const now = new Date();
    
    await this.prisma.otp.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }

  async cleanupConflictingOtps(email: string, context: string, channel: OtpChannel): Promise<void> {
    // Find all OTPs for this email/context/channel combination
    const conflictingOtps = await this.prisma.otp.findMany({
      where: {
        email,
        context,
        channel,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (conflictingOtps.length > 1) {
      // Keep only the most recent one, delete the rest
      const otpsToDelete = conflictingOtps.slice(1); // All except the most recent
      const idsToDelete = otpsToDelete.map((otp: any) => otp.id);
      
      if (idsToDelete.length > 0) {
        await this.prisma.otp.deleteMany({
          where: {
            id: {
              in: idsToDelete,
            },
          },
        });
        console.log(`Cleaned up ${idsToDelete.length} conflicting OTPs for ${email}:${context}`);
      }
    }
  }

  private mapPrismaToOtpRecord(prismaOtp: any): OtpRecord {
    return {
      id: prismaOtp.id,
      email: prismaOtp.email,
      context: prismaOtp.context,
      sessionId: prismaOtp.sessionId,
      channel: prismaOtp.channel,
      otpHash: prismaOtp.otpHash,
      hmac: prismaOtp.hmac,
      expiresAt: new Date(prismaOtp.expiresAt),
      attempts: prismaOtp.attempts,
      maxAttempts: prismaOtp.maxAttempts,
      isUsed: prismaOtp.isUsed,
      isLocked: prismaOtp.isLocked,
      requestMeta: prismaOtp.requestMeta as RequestMeta,
      createdAt: new Date(prismaOtp.createdAt),
      updatedAt: new Date(prismaOtp.updatedAt),
    };
  }
}
