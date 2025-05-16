import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { EnvModule } from './env/env.module';


@Module({
  imports: [PaymentsModule, UserModule, PrismaModule, EnvModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
