import * as PrismaPkg from '@prisma/client';

const PrismaClientClass = (PrismaPkg as any).PrismaClient || (PrismaPkg as any).default?.PrismaClient;

export const prisma: any = PrismaClientClass ? new PrismaClientClass() : {};
