import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    fullName: string,
    verificationCode: string,
    email: string,
  ) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email',
      template: 'verification',
      context: {
        fullName: fullName,
        verificationCode: verificationCode,
      },
    });
  }
}
