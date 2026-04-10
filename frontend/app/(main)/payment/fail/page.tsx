'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Result } from 'antd';

import { appRoute } from '@/app/config/appRoute';
import { clearPendingPurchase } from '@/app/lib/vnpayPurchase';

const VNPAY_RESPONSE_MESSAGES: Record<string, string> = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công, giao dịch bị nghi ngờ',
  '09': 'Thẻ/Tài khoản chưa đăng ký InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Hết hạn chờ thanh toán',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Nhập sai mật khẩu OTP',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Vượt hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Lỗi không xác định',
};

function PaymentFailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const responseCode = searchParams.get('responseCode') ?? '';
  const messageParam = searchParams.get('message') ?? '';
  const txnRef = searchParams.get('txnRef') ?? '';

  const reason =
    messageParam ||
    VNPAY_RESPONSE_MESSAGES[responseCode] ||
    (responseCode ? `Mã lỗi VNPay: ${responseCode}` : 'Giao dịch không thành công');

  return (
    <Result
      status="error"
      title="Thanh toán không thành công"
      subTitle={
        <>
          <span className="block">{reason}</span>
          {txnRef ? (
            <span className="mt-2 block text-xs text-neutral-500">
              Mã giao dịch: {txnRef}
            </span>
          ) : null}
        </>
      }
      extra={[
        <Button
          key="retry"
          type="primary"
          onClick={() => router.push(appRoute.home.purchasePackage)}
        >
          Thử lại thanh toán
        </Button>,
        <Button
          key="clear"
          onClick={() => {
            clearPendingPurchase();
            router.push(appRoute.home.packages);
          }}
        >
          Chọn gói khác
        </Button>,
      ]}
    />
  );
}

export default function PaymentFailPage() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Suspense fallback={null}>
          <PaymentFailContent />
        </Suspense>
      </div>
    </div>
  );
}
