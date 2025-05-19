import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { EnvModule } from 'src/env/env.module';
import { PrismaModule } from 'src/prisma/prisma.module';


@Module({
    imports: [EnvModule, PrismaModule],
    controllers: [PaymentsController],
    providers: [PaymentsService],
    exports: [PaymentsService]
})
export class PaymentsModule { }
