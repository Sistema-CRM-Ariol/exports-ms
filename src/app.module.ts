import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ExportsModule } from './exports/exports.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [PrismaModule, ExportsModule, NatsModule],
})
export class AppModule {}
