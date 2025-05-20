import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EnvModule } from '@/env/env.module';
import { PrismaModule } from '@/prisma/prisma.module';


@Module({
    imports: [EnvModule, PrismaModule],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService]
})
export class PaymentsModule { }
