'use client';

import { ArrowRightOutlined, CheckOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type { Package as ApiPackage } from '@/app/types/types';

export type Package = ApiPackage;

type PackageCardProps = {
  package: Package;
  isFeatured?: boolean;
  onSelect?: (pkg: Package) => void;
};

type PackageFeature = {
  label: string;
  article: string;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price);
}

function getUnitLabel(unit: 'DAY' | 'MONTH'): string {
  return unit === 'DAY' ? 'Ngày' : 'Tháng';
}

function getFeatures(pkg: Package): PackageFeature[] {
  const features: PackageFeature[] = [
    { label: 'Truy cập toàn bộ phòng gym', article: 'gym-access' },
    { label: 'Thiết bị tập luyện hiện đại', article: 'modern-equipment' },
    { label: 'Phòng thay đồ, tủ đồ', article: 'locker-room' },
  ];
  if (pkg.hasPt) {
    const sessions = pkg.ptSessionsIncluded ?? 0;
    features.push({
      label:
        sessions > 0
          ? `${sessions} buổi PT cá nhân`
          : 'Huấn luyện viên cá nhân',
      article: 'personal-training',
    });
  }
  features.push({ label: 'Hỗ trợ tư vấn dinh dưỡng', article: 'nutrition-support' });
  return features;
}

export default function PackageCard({
  package: pkg,
  isFeatured = false,
  onSelect,
}: PackageCardProps) {
  const router = useRouter();
  const features = getFeatures(pkg);
  const unitLabel = getUnitLabel(pkg.unit);
  const durationText = `${pkg.durationValue} ${unitLabel}`;

  return (
    <div className="group flex flex-col rounded-2xl border p-8 transition-all border-neutral-200 bg-white text-neutral-800 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white hover:shadow-xl">
      <h3
        className="
       text-xl font-medium
       text-neutral-800
       group-hover:text-white
     "
      >
        {pkg.name}
      </h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-neutral-900 group-hover:text-white">
          {formatPrice(pkg.price)} ₫
        </span>
        <span className="text-base font-normal text-neutral-500">
          / {durationText}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-500 group-hover:text-neutral-300">
        {pkg.description ||
          'Gói tập luyện linh hoạt, phù hợp với nhu cầu của bạn. Truy cập đầy đủ trang thiết bị và không gian tập luyện.'}
      </p>

      <ul className="mt-6 flex-1 space-y-4">
        {features.map((feature, index) => (
          <li key={`${feature.article}-${index}`}>
            <button
              type="button"
              onClick={() => router.push(`/about?article=${feature.article}`)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-neutral-50 px-4 py-3 text-left transition-all hover:border-neutral-300 hover:bg-neutral-100 group-hover:bg-white/10 group-hover:hover:border-white/20"
            >
              <span className="flex items-start gap-3">
                <CheckOutlined className="mt-0.5 shrink-0 text-neutral-600 group-hover:text-white" />
                <span className="text-sm text-neutral-600 group-hover:text-neutral-200">
                  {feature.label}
                </span>
              </span>
              <ArrowRightOutlined className="shrink-0 text-xs text-neutral-400 transition-transform group-hover:text-neutral-200" />
            </button>
          </li>
        ))}
      </ul>

      <button
        className="mt-8 w-full rounded-xl px-6 py-3 font-semibold transition-colors bg-neutral-900 text-white hover:bg-neutral-800 group-hover:bg-white group-hover:text-neutral-900"
        type="button"
        onClick={() => onSelect?.(pkg)}
      >
        Chọn gói
      </button>
    </div>
  );
}
