import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VnpayModule } from 'nestjs-vnpay';
import { HashAlgorithm, ignoreLogger } from 'vnpay';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [
    VnpayModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        tmnCode: configService.getOrThrow<string>('VNPAY_TMN_CODE'),
        secureSecret: configService.getOrThrow<string>('VNPAY_SECURE_SECRET'),
        vnpayHost: configService.get<string>(
          'VNPAY_HOST',
          'https://sandbox.vnpayment.vn',
        ),
        testMode: configService.get<string>('VNPAY_TEST_MODE') !== 'false',
        hashAlgorithm: HashAlgorithm.SHA512,
        enableLog: configService.get<string>('NODE_ENV') !== 'production',
        loggerFn: ignoreLogger,
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PaymentController],
  providers: [PaymentService, PrismaService],
})
export class PaymentModule {}
