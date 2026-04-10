import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { BranchModule } from './branch/branch.module';
import { PackageModule } from './package/package.module';
import { UserPackageModule } from './user-package/user-package.module';
import { PersonalTrainerModule } from './personal-trainer/personal-trainer.module';
import { ExcerciseModule } from './excercise/excercise.module';
import { ProgramModule } from './program/program.module';
import { AiModule } from './ai/ai.module';
import { CronjobModule } from './cronjob/cronjob.module';
import { PtKpiModule } from './pt-kpi/pt-kpi.module';
import { AdminAnalyticsModule } from './admin-analytics/admin-analytics.module';
import { PaymentModule } from './payment/payment.module';
import { ScheduleModule } from '@nestjs/schedule';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AccountModule,
    AuthModule,
    MailModule,
    BranchModule,
    PackageModule,
    UserPackageModule,
    PersonalTrainerModule,
    ExcerciseModule,
    ProgramModule,
    AiModule,
    CronjobModule,
    PtKpiModule,
    AdminAnalyticsModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
