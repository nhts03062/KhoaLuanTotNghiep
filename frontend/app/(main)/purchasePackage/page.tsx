'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Result, Steps, message } from 'antd';

import {
  createVnpayDemoCheckout,
  getBranches,
  getPackages,
} from '@/app/services/api';
import { savePendingPurchase } from '@/app/lib/vnpayPurchase';
import type { FILTER_PACKAGE_PROPS, FILTER_PROPS } from '@/app/types/filters';
import type { Branch, Package } from '@/app/types/types';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/app/stores/authStore';
import SelectPackageStep from '@/app/components/purchase/SelectPackageStep';
import SelectBranchStep from '@/app/components/purchase/SelectBranchStep';
import ConfirmPurchaseStep from '@/app/components/purchase/ConfirmPurchaseStep';

export default function PurchasePackagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const packageIdFromQuery = searchParams.get('packageId');

  const { isLoggedIn, loading: authLoading } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    null,
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  const [packageFilters] = useState<FILTER_PACKAGE_PROPS>({
    page: 1,
    itemsPerPage: 50,
    unit: undefined,
  });
  const [branchFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 50,
    search: undefined,
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      message.warning('Vui lòng đăng nhập trước khi đăng ký gói tập.');
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const { data: packagesRes, isLoading: isLoadingPackages } = useQuery({
    queryKey: ['packages', packageFilters],
    queryFn: () => getPackages(packageFilters),
    enabled: isLoggedIn,
  });

  const { data: branchesRes, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches', branchFilters],
    queryFn: () => getBranches(branchFilters),
    enabled: isLoggedIn,
  });

  const packages: Package[] = packagesRes?.data ?? [];
  const branches: Branch[] = branchesRes?.data ?? [];

  useEffect(() => {
    const initialPackageId = searchParams.get('packageId');
    if (!initialPackageId || selectedPackageId) return;
    const exists = packages.some((pkg) => pkg.id === initialPackageId);
    if (exists) {
      setSelectedPackageId(initialPackageId);
    }
  }, [packages, searchParams, selectedPackageId]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const displayPackages = useMemo(() => {
    if (packageIdFromQuery) {
      return packages.filter((pkg) => pkg.id === packageIdFromQuery);
    }
    if (selectedPackageId) {
      return packages.filter((pkg) => pkg.id === selectedPackageId);
    }
    return packages;
  }, [packages, packageIdFromQuery, selectedPackageId]);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedBranchId) ?? null,
    [branches, selectedBranchId],
  );

  const steps = ['Gói tập', 'Cơ sở', 'Xác nhận'];

  const isConfirmStep = currentStep === 2;

  const canProceed = () => {
    if (currentStep === 0) return !!selectedPackageId;
    if (currentStep === 1) return !!selectedBranchId;
    return true;
  };

  const handleNext = () => {
    if (!canProceed()) {
      message.warning('Vui lòng chọn đầy đủ thông tin trước khi tiếp tục.');
      return;
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.push('/packages');
    }
  };

  const { mutate: startVnpayCheckout, isPending: isPaying } = useMutation({
    mutationFn: (packageId: string) => createVnpayDemoCheckout({ packageId }),
    onSuccess: (res) => {
      if (!selectedPackageId || !selectedBranchId) return;

      savePendingPurchase({
        packageId: selectedPackageId,
        branchId: selectedBranchId,
        packageName: selectedPackage?.name ?? res.data.packageName,
        branchName: selectedBranch?.name,
        amount: res.data.amount,
      });

      window.location.href = res.data.paymentUrl;
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string }>;
      message.error(
        axiosErr?.response?.data?.message ??
          'Không thể tạo link thanh toán VNPay. Vui lòng thử lại.',
      );
    },
  });

  const handleConfirm = () => {
    if (!selectedPackageId || !selectedBranchId) {
      message.error('Thiếu thông tin gói tập hoặc cơ sở.');
      return;
    }

    startVnpayCheckout(selectedPackageId);
  };

  if (!isLoggedIn && !authLoading) {
    return (
      <Result
        status="warning"
        title="Vui lòng đăng nhập để đăng ký gói tập"
        extra={
          <Button type="primary" onClick={() => router.push('/')}>
            Về trang chủ
          </Button>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 pt-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 md:text-4xl">
            Đăng ký gói tập
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Hoàn thành các bước bên dưới để đăng ký gói tập tại PowerFit.
          </p>
        </div>

        <Steps
          current={currentStep}
          items={steps.map((title) => ({ title }))}
        />

        <div className="mt-4">
          {currentStep === 0 && (
            <SelectPackageStep
              loading={isLoadingPackages}
              packages={displayPackages}
              selectedPackageId={selectedPackageId}
              onSelect={(pkg) => {
                setSelectedPackageId(pkg.id);
              }}
            />
          )}

          {currentStep === 1 && (
            <SelectBranchStep
              loading={isLoadingBranches}
              branches={branches}
              selectedBranchId={selectedBranchId}
              onSelect={(branch) => setSelectedBranchId(branch.id)}
            />
          )}

          {isConfirmStep && (
            <ConfirmPurchaseStep
              selectedPackage={selectedPackage}
              selectedBranch={selectedBranch}
            />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/90 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4">
            <Button onClick={handleBack}>Quay lại</Button>
            {isConfirmStep ? (
              <Button
                type="primary"
                onClick={handleConfirm}
                loading={isPaying}
              >
                Thanh toán VNPay
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Tiếp tục
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
