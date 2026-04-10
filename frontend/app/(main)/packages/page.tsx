'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { message } from 'antd';
import { useRouter } from 'next/navigation';

import { getPackages } from '@/app/services/api';
import type { FILTER_PACKAGE_PROPS } from '@/app/types/filters';
import type { Package } from '@/app/types/types';
import PackageCard from '@/app/components/card/packageCard';
import { useAuthStore } from '@/app/stores/authStore';

export default function PackagesPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [filters, setFilters] = useState<FILTER_PACKAGE_PROPS>({
    page: 1,
    itemsPerPage: 12,
    unit: undefined,
  });

  const [activeUnit, setActiveUnit] = useState<'DAY' | 'MONTH' | 'ALL'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['packages-public', filters],
    queryFn: () => getPackages(filters),
  });

  const packages: Package[] = data?.data ?? [];

  const handleFilterChange = (unit: 'DAY' | 'MONTH' | 'ALL') => {
    setActiveUnit(unit);
    setFilters((prev) => ({
      ...prev,
      unit: unit === 'ALL' ? undefined : unit,
    }));
  };

  const handleSelectPackage = (pkg: Package) => {
    if (!isLoggedIn) {
      message.warning('Vui lòng đăng nhập trước khi đăng ký gói tập.');
      return;
    }
    router.push(`/purchasePackage?packageId=${pkg.id}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(0,0%,100%)_0,hsl(0,0%,96%)_45%,hsl(0,0%,92%)_100%)]" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 text-center md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold tracking-wide text-white">
              GÓI TẬP TẠI POWERFIT
            </span>
            <h1 className="mt-4 text-3xl font-bold text-neutral-900 md:text-5xl">
              Chọn gói tập
              <span className="text-neutral-500"> phù hợp với bạn</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 md:text-lg">
              Các gói tập linh hoạt theo ngày hoặc theo tháng, đi kèm trang thiết bị hiện đại
              và hỗ trợ từ đội ngũ huấn luyện viên chuyên nghiệp.
            </p>
          </motion.div>

          {/* Unit filter toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="mt-8 flex items-center gap-4"
          >
            <div className="flex rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => handleFilterChange('ALL')}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                  activeUnit === 'ALL'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('MONTH')}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                  activeUnit === 'MONTH'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Theo tháng
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('DAY')}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                  activeUnit === 'DAY'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Theo ngày
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Packages grid */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-neutral-500">Đang tải các gói tập...</p>
          </div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-base font-medium text-neutral-700">
              Hiện chưa có gói tập nào phù hợp.
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Vui lòng thử lại sau hoặc chọn bộ lọc khác.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {packages.map((pkg, index) => {
              const isFeatured =
                packages.length >= 3
                  ? index === Math.floor(packages.length / 2)
                  : index === 0;

              return (
                <motion.div
                  key={pkg.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <PackageCard
                    package={pkg}
                    isFeatured={isFeatured}
                    onSelect={handleSelectPackage}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
