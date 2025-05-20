import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PaymentsModule } from '@/payments/payments.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
    imports: [PaymentsModule, PrismaModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule { }
