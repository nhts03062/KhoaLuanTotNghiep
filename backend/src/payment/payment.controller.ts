import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { ReturnQueryFromVNPay } from 'vnpay';
import { Role } from 'generated/prisma/enums';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { PaymentService } from './payment.service';
import { VnpayDemoCheckoutDto } from './dto/vnpay-demo-checkout.dto';

@Controller('payments/vnpay')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('demo-checkout')
  async demoCheckout(@Req() req: Request, @Body() dto: VnpayDemoCheckoutDto) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      '127.0.0.1';
    return this.paymentService.createDemoCheckout(ip, dto);
  }

  @Get('return')
  async demoReturn(
    @Query() query: ReturnQueryFromVNPay,
    @Res() res: Response,
  ) {

  }
}
