import { NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  const vnpayMock = {
    buildPaymentUrl: jest.fn().mockReturnValue('https://sandbox.vnpayment.vn/pay'),
    verifyReturnUrl: jest.fn(),
  };

  const configMock = {
    getOrThrow: jest.fn((key: string) => {
      const map: Record<string, string> = {
        VNPAY_RETURN_URL: 'http://localhost:8080/api/v1/payments/vnpay/return',
        VNPAY_FRONTEND_SUCCESS_URL: 'http://localhost:5173/payment/success',
        VNPAY_FRONTEND_FAIL_URL: 'http://localhost:5173/payment/fail',
      };
      return map[key];
    }),
  };

  const prismaMock = {
    package: {
      findFirst: jest.fn(),
    },
  };

  let service: PaymentService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PaymentService(
      vnpayMock as any,
      configMock as any,
      prismaMock as any,
    );
  });

  it('creates demo checkout with payment URL', async () => {
    prismaMock.package.findFirst.mockResolvedValue({
      id: 'pkg-1',
      name: 'Gói 1 tháng',
      price: 500000,
    });

    const result = await service.createDemoCheckout('127.0.0.1', {
      packageId: 'pkg-1',
    });

    expect(result.data.paymentUrl).toBe(
      'https://sandbox.vnpayment.vn/pay',
    );
    expect(result.data.amount).toBe(500000);
    expect(result.data.txnRef).toMatch(/^demo-/);
    expect(vnpayMock.buildPaymentUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        vnp_Amount: 500000,
        vnp_TxnRef: expect.stringMatching(/^demo-/),
        vnp_ReturnUrl: 'http://localhost:8080/api/v1/payments/vnpay/return',
      }),
    );
  });

  it('throws when package not found', async () => {
    prismaMock.package.findFirst.mockResolvedValue(null);

    await expect(
      service.createDemoCheckout('127.0.0.1', { packageId: 'missing' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('redirects to success URL when return verified and successful', async () => {
    vnpayMock.verifyReturnUrl.mockResolvedValue({
      isVerified: true,
      isSuccess: true,
      message: 'Success',
      vnp_TxnRef: 'demo-abc',
      vnp_ResponseCode: '00',
      vnp_Amount: 50000000,
    });

    const result = await service.handleDemoReturn({
      vnp_TxnRef: 'demo-abc',
      vnp_ResponseCode: '00',
    } as any);

    expect(result.redirectUrl).toContain(
      'http://localhost:5173/payment/success',
    );
    expect(result.redirectUrl).toContain('success=1');
    expect(result.redirectUrl).toContain('txnRef=demo-abc');
  });

  it('redirects to fail URL when payment not successful', async () => {
    vnpayMock.verifyReturnUrl.mockResolvedValue({
      isVerified: true,
      isSuccess: false,
      message: 'Cancelled',
      vnp_TxnRef: 'demo-xyz',
      vnp_ResponseCode: '24',
    });

    const result = await service.handleDemoReturn({
      vnp_TxnRef: 'demo-xyz',
      vnp_ResponseCode: '24',
    } as any);

    expect(result.redirectUrl).toContain('http://localhost:5173/payment/fail');
    expect(result.redirectUrl).toContain('success=0');
  });
});
