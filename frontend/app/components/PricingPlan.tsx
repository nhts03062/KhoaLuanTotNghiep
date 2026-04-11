'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPackages } from '../services/api';
import PackageCard, { type Package } from './card/packageCard';
import { FILTER_PACKAGE_PROPS } from '../types/filters';

export default function PricingPlan() {
  const [filters, setFilters] = useState<FILTER_PACKAGE_PROPS>({
    page: 1,
    itemsPerPage: 10,
    unit: undefined,
  });
  const [isYearly, setIsYearly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['packages', filters],
    queryFn: () => getPackages(filters),
  });

  const packages: Package[] = data?.data ?? [];

  return (
    <section className="w-full bg-neutral-50 py-20">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-12">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wider text-neutral-500">
              Pricing Plan
            </p>
            <h2 className="mt-2 text-4xl font-bold text-neutral-900 md:text-5xl">
              JOIN US NOW
            </h2>
          </div>

          {/* Toggle */}
          <div className="flex rounded-xl border border-neutral-200 bg-white p-1">
            <button
              onClick={() => {
                setIsYearly(false);
                setFilters((prev) => ({
                  ...prev,
                  unit: 'MONTH',
                }));
              }}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
                !isYearly
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setIsYearly(true);
                setFilters((prev) => ({
                  ...prev,
                  unit: 'DAY',
                }));
              }}
              className={`rounded-lg px-6 py-2 text-sm font-medium transition-colors ${
                isYearly
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Daily
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg, index) => {
            // Middle card is featured when we have 3 cards, otherwise first card
            const isFeatured =
              packages.length >= 3
                ? index === Math.floor(packages.length / 2)
                : index === 0;

            return (
              <PackageCard key={pkg.id} package={pkg} isFeatured={isFeatured} />
            );
          })}
        </div>

        {packages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-neutral-500">Đang tải các gói tập...</p>
          </div>
        )}
      </div>
    </section>
  );
}
