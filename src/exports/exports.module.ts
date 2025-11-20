import { Module } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [ExportsController],
  providers: [ExportsService],
  imports: [PrismaModule, NatsModule],
})
export class ExportsModule {}
