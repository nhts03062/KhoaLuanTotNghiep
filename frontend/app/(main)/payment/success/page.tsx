'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button, Result, Spin, message } from 'antd';
import { AxiosError } from 'axios';

import { appRoute } from '@/app/config/appRoute';
import {
  clearPendingPurchase,
  getPendingPurchase,
  isTxnProcessed,
  markTxnProcessed,
} from '@/app/lib/vnpayPurchase';
import { purchasePackage } from '@/app/services/api';
import type { PurchasePackageRequest } from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, loading: authLoading } = useAuthStore();
  const startedRef = useRef(false);

  const success = searchParams.get('success') === '1';
  const verified = searchParams.get('verified') === '1';
  const txnRef = searchParams.get('txnRef') ?? '';

  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { mutate: completePurchase, isPending } = useMutation({
    mutationFn: (body: PurchasePackageRequest) => purchasePackage(body),
    onSuccess: () => {
      if (txnRef) markTxnProcessed(txnRef);
      clearPendingPurchase();
      setDone(true);
      message.success('Thanh toán và đăng ký gói tập thành công!');
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setErrorMsg(
        axiosErr?.response?.data?.message ??
          'Thanh toán VNPay thành công nhưng kích hoạt gói thất bại. Vui lòng liên hệ hỗ trợ.',
      );
    },
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      message.warning('Vui lòng đăng nhập để hoàn tất đăng ký gói.');
      router.replace('/');
    }
  }, [authLoading, isLoggedIn, router]);

  useEffect(() => {
    if (authLoading || !isLoggedIn || startedRef.current) return;
    if (!success || !verified) return;

    if (txnRef && isTxnProcessed(txnRef)) {
      setDone(true);
      return;
    }

    const pending = getPendingPurchase();
    if (!pending?.packageId || !pending?.branchId) {
      setErrorMsg(
        'Không tìm thấy thông tin đăng ký. Vui lòng thực hiện lại từ trang mua gói.',
      );
      return;
    }

    startedRef.current = true;
    completePurchase({
      packageId: pending.packageId,
      branchId: pending.branchId,
    });
  }, [authLoading, isLoggedIn, success, verified, txnRef, completePurchase]);

  if (authLoading || (!done && !errorMsg && success && verified && isPending)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-sm text-neutral-600">
          Đang kích hoạt gói tập sau thanh toán VNPay...
        </p>
      </div>
    );
  }

  if (!success || !verified) {
    return (
      <Result
        status="warning"
        title="Thanh toán chưa được xác nhận"
        subTitle="VNPay chưa báo thanh toán thành công. Bạn có thể thử lại."
        extra={
          <Button type="primary" onClick={() => router.push(appRoute.payment.fail)}>
            Xem chi tiết
          </Button>
        }
      />
    );
  }

  if (errorMsg) {
    return (
      <Result
        status="error"
        title="Chưa kích hoạt được gói tập"
        subTitle={errorMsg}
        extra={
          <Button
            type="primary"
            onClick={() => router.push(appRoute.home.purchasePackage)}
          >
            Quay lại mua gói
          </Button>
        }
      />
    );
  }

  return (
    <Result
      status="success"
      title="Thanh toán thành công"
      subTitle="Gói tập của bạn đã được kích hoạt."
      extra={[
        <Button
          key="packages"
          type="primary"
          onClick={() => router.push(appRoute.user.root)}
        >
          Xem gói tập của tôi
        </Button>,
        <Button key="home" onClick={() => router.push(appRoute.home.root)}>
          Về trang chủ
        </Button>,
      ]}
    />
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Spin size="large" />
            </div>
          }
        >
          <PaymentSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}
