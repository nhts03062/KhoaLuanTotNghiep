import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VnpayService } from 'nestjs-vnpay';
import { dateFormat, ignoreLogger } from 'vnpay';
import type { ReturnQueryFromVNPay } from 'vnpay';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { VnpayDemoCheckoutDto } from './dto/vnpay-demo-checkout.dto';

function toVnpayOrderInfo(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .slice(0, 255);
}

@Injectable()
export class PaymentService {
  constructor(
    private readonly vnpayService: VnpayService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async createDemoCheckout(clientIp: string, dto: VnpayDemoCheckoutDto) {
    const pkg = await this.prisma.package.findFirst({
      where: { id: dto.packageId, isActive: true },
      select: { id: true, name: true, price: true },
    });
    if (!pkg) {
      throw new NotFoundException('Package not found or inactive');
    }

    const returnUrl = this.configService.getOrThrow<string>('VNPAY_RETURN_URL');
    const txnRef = `demo-${randomUUID()}`;
    const expireAt = new Date(Date.now() + 15 * 60 * 1000);

    const paymentUrl = this.vnpayService.buildPaymentUrl({
      vnp_Amount: pkg.price,
      vnp_OrderInfo: `Thanh toan goi ${toVnpayOrderInfo(pkg.name)}`,
      vnp_TxnRef: txnRef,
      vnp_IpAddr: clientIp || '127.0.0.1',
      vnp_ReturnUrl: returnUrl,
      vnp_ExpireDate: dateFormat(expireAt),
    });

    return {
      message: 'Create VNPay demo checkout successfully',
      data: {
        paymentUrl,
        txnRef,
        amount: pkg.price,
        packageId: pkg.id,
        packageName: pkg.name,
        expiresAt: expireAt.toISOString(),
      },
    };
  }

  async handleDemoReturn(query: ReturnQueryFromVNPay) {
    const result = await this.vnpayService.verifyReturnUrl(query);

    const successUrl = this.configService.getOrThrow<string>(
      'VNPAY_FRONTEND_SUCCESS_URL',
    );
    const failUrl = this.configService.getOrThrow<string>(
      'VNPAY_FRONTEND_FAIL_URL',
    );

    const baseParams = new URLSearchParams({
      txnRef: String(result.vnp_TxnRef ?? ''),
      verified: result.isVerified ? '1' : '0',
      responseCode: String(result.vnp_ResponseCode ?? ''),
    });

    if (result.vnp_Amount != null) {
      baseParams.set('amount', String(result.vnp_Amount));
    }

    if (result.isVerified && result.isSuccess) {
      baseParams.set('success', '1');
      return {
        redirectUrl: `${successUrl}?${baseParams.toString()}`,
        verified: result.isVerified,
        success: result.isSuccess,
        message: result.message,
      };
    }

    baseParams.set('success', '0');
    if (result.message) {
      baseParams.set('message', result.message);
    }

    return {
      redirectUrl: `${failUrl}?${baseParams.toString()}`,
      verified: result.isVerified,
      success: result.isSuccess,
      message: result.message,
    };
  }
}
