import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PaymentsModule } from 'src/payments/payments.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PaymentsModule, PrismaModule],
    controllers: [UserController],
    providers: [UserService],
})
export class UserModule { }
