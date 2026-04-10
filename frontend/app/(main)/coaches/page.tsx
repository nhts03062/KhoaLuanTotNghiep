'use client';

import { appRoute } from '@/app/config/appRoute';
import {
  fitnessGoalLabel,
  fitnessGoalSpecialty,
  ptExpertiseIntro,
} from '@/app/lib/ptFitnessGoal';
import {
  displayPtHeightCm,
  displayPtName,
  displayPtWeightKg,
  genderLabelVi,
  resolvePtAvatarSrcWithFallback,
} from '@/app/lib/ptProfileDisplay';
import { getPtAccounts } from '@/app/services/api';
import type { PtAccount, PtAccountsResponse } from '@/app/types/types';
import {
  Award,
  Calendar,
  Check,
  DollarSign,
  MapPin,
  Star,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { Empty, Input, Pagination, Skeleton } from 'antd';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function seededFromString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function extrasForPt(pt: PtAccount) {
  const seed = seededFromString(pt.id + pt.email);
  const rating = 4.5 + (seed % 50) / 100;
  const reviews = 18 + (seed % 212);
  const students = 24 + (seed % 286);
  return {
    rating: rating.toFixed(1),
    reviews,
    students,
  };
}

function modalSkills(pt: PtAccount) {
  const goalLabel = fitnessGoalLabel(pt.profile?.fitnessGoal);
  const seed = seededFromString(pt.id);
  const level = 68 + (seed % 27);
  if (goalLabel) {
    return [
      { name: goalLabel, level },
      { name: 'Kỹ thuật & an toàn tập luyện', level: 72 + (seed % 23) },
    ];
  }
  return [
    { name: 'Huấn luyện tổng hợp', level },
    { name: 'Động lực & theo dõi tiến độ', level: 65 + (seed % 30) },
  ];
}

function resolveCoachAvatarSrc(pt: PtAccount): string {
  return resolvePtAvatarSrcWithFallback(pt.profile?.avatar);
}

interface CoachSkillBarProps {
  name: string;
  level: number;
}

function CoachSkillBar({ name, level }: CoachSkillBarProps) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-sans text-xs">
        <span className="text-neutral-900">{name}</span>
        <span className="font-medium text-amber-600">{level}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-linear-to-r from-amber-500 to-amber-700 transition-[width]"
          style={{ width: `${Math.min(100, Math.max(0, level))}%` }}
        />
      </div>
    </div>
  );
}

export default function CoachesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(8);
  const [search, setSearch] = useState('');
  const [draftSearch, setDraftSearch] = useState('');
  const [selected, setSelected] = useState<PtAccount | null>(null);

  useEffect(() => {
    if (!selected) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [selected]);

  const query = useMemo(
    () => ({
      page,
      itemsPerPage: pageSize,
      search: search.trim() || undefined,
    }),
    [page, pageSize, search],
  );

  const { data, isLoading, isFetching } = useQuery<PtAccountsResponse>({
    queryKey: ['public-pt-coaches', query],
    queryFn: () => getPtAccounts(query),
  });

  const pts: PtAccount[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const runSearch = () => {
    setSearch(draftSearch);
    setPage(1);
  };

  const selectedExtras = selected ? extrasForPt(selected) : null;

  return (
    <div className="min-h-[70vh] bg-neutral-50" id="huan-luyen-vien">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-linear-to-b from-amber-500/12 via-neutral-50 to-neutral-50 pt-12 pb-14 md:pt-16 md:pb-18">
        <div className="mx-auto max-w-7xl px-4 text-center md:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-neutral-900 md:text-5xl lg:text-6xl"
          >
            ĐỘI NGŨ{' '}
            <span className="bg-linear-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
              HUẤN LUYỆN VIÊN
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-4 max-w-2xl text-base text-neutral-600 md:text-lg"
          >
            Gặp gỡ những huấn luyện viên đồng hành cùng bạn trên hành trình chinh
            phục mục tiêu thể chất tại PowerFit.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-8 max-w-md"
          >
            <Input.Search
              allowClear
              placeholder="Tìm theo email PT..."
              size="large"
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onSearch={runSearch}
              loading={isFetching && !isLoading}
            />
          </motion.div>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-16">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
              >
                <Skeleton.Image
                  active
                  className="aspect-3/4! h-auto! w-full!"
                />
                <div className="p-4">
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                </div>
              </div>
            ))}
          </div>
        ) : pts.length === 0 ? (
          <Empty
            description="Chưa có huấn luyện viên nào được hiển thị."
            className="py-16"
          >
            <Link
              href={appRoute.home.packages}
              className="text-neutral-900 underline"
            >
              Khám phá gói tập
            </Link>
          </Empty>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pts.map((pt, i) => {
                const name = displayPtName(pt);
                const img = resolveCoachAvatarSrc(pt);
                const { rating, students } = extrasForPt(pt);
                return (
                  <motion.button
                    key={pt.id}
                    type="button"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setSelected(pt)}
                    className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:border-amber-500/70 hover:shadow-[0_0_24px_-4px_rgba(245,158,11,0.35)]"
                  >
                    <div className="relative aspect-3/4 overflow-hidden bg-neutral-200">
                      <img
                        src={img}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/55 to-transparent" />
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur-sm">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-semibold text-white">
                          {rating}
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white md:p-5">
                        <h3 className="text-lg font-bold leading-tight drop-shadow-md">
                          {name}
                        </h3>
                        <p className="mt-0.5 text-sm font-medium text-amber-300">
                          {fitnessGoalSpecialty(pt.profile?.fitnessGoal)}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-xs text-white/85">
                          <span className="flex items-center gap-1">
                            <Users size={12} aria-hidden /> {students}+ HV
                          </span>
                          <span>PowerFit</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {total > pageSize ? (
              <div className="mt-10 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
                  onChange={(p) => setPage(p)}
                />
              </div>
            ) : null}
          </>
        )}
      </section>

      <AnimatePresence>
        {selected && selectedExtras ? (
          <motion.div
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="coach-modal-title"
              initial={{ scale: 0.92, opacity: 0, y: 28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 28 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative my-8 w-full max-w-4xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-amber-500 hover:text-white"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>

              <div className="relative h-48 overflow-hidden md:h-60">
                <img
                  src={resolveCoachAvatarSrc(selected)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-white via-white/45 to-transparent" />
              </div>

              <div className="relative -mt-16 px-6 md:px-8">
                <div className="flex flex-col items-start gap-4 md:flex-row md:items-end">
                  <img
                    src={resolveCoachAvatarSrc(selected)}
                    alt={displayPtName(selected)}
                    className="h-32 w-32 rounded-2xl border-4 border-white object-cover shadow-lg"
                  />
                  <div className="flex-1 pb-2">
                    <h2
                      id="coach-modal-title"
                      className="text-2xl font-bold text-neutral-900 md:text-3xl"
                    >
                      {displayPtName(selected)}
                    </h2>
                    <p className="mt-0.5 font-medium text-amber-600">
                      {fitnessGoalSpecialty(selected.profile?.fitnessGoal)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Star
                          size={12}
                          className="fill-amber-500 text-amber-500"
                        />{' '}
                        {selectedExtras.rating} ({selectedExtras.reviews} đánh giá)
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} aria-hidden /> {selectedExtras.students}+
                        học viên
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} aria-hidden /> PowerFit Gym
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 md:grid-cols-3 md:p-8">
                <div className="space-y-6 md:col-span-2">
                  <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-4">
                    <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-amber-800/90">
                      Giới thiệu chuyên môn
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-700">
                      {ptExpertiseIntro(
                        displayPtName(selected),
                        selected.profile?.fitnessGoal,
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-900">
                      Định hướng{' '}
                      <span className="font-normal normal-case text-neutral-500">
                        (tham khảo)
                      </span>
                    </h3>
                    <div className="space-y-3">
                      {modalSkills(selected).map((s) => (
                        <CoachSkillBar
                          key={s.name}
                          name={s.name}
                          level={Math.min(100, s.level)}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900">
                      <Award size={14} className="text-amber-600" />
                      Thông tin PT
                    </h3>
                    <ul className="space-y-2 text-sm text-neutral-600">
                      {selected.profile?.phone ? (
                        <li className="flex items-start gap-2">
                          <Check
                            size={14}
                            className="mt-0.5 shrink-0 text-amber-600"
                          />
                          Điện thoại: {selected.profile.phone}
                        </li>
                      ) : null}
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />
                        Email: {selected.email}
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0 text-amber-600"
                        />
                        {displayPtHeightCm(selected.profile?.height)} ·{' '}
                        {displayPtWeightKg(selected.profile?.weight)}
                      </li>
                      {genderLabelVi(selected.profile?.gender) ? (
                        <li className="flex items-start gap-2">
                          <Check
                            size={14}
                            className="mt-0.5 shrink-0 text-amber-600"
                          />
                          Giới tính: {genderLabelVi(selected.profile?.gender)}
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-100/80 p-4">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <DollarSign size={14} className="text-amber-600" />
                      Học phí buổi
                    </div>
                    <p className="mt-1 text-2xl font-bold text-amber-600">
                      Theo gói tập
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Giá cụ thể phụ thuộc gói bạn chọn.
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-200 bg-neutral-100/80 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-neutral-500">
                      <Calendar size={14} className="text-amber-600" />
                      Lịch làm việc
                    </div>
                    <ul className="space-y-1 text-sm text-neutral-800">
                      <li>• Đặt lịch theo khung giờ PT đã đăng ký tại PowerFit</li>
                      <li>• Sau khi mua gói có PT, chọn PT và tuần để xem lưới giờ</li>
                    </ul>
                  </div>

                  <Link
                    href={appRoute.home.packages}
                    onClick={() => setSelected(null)}
                    className="flex w-full items-center justify-center rounded-lg bg-neutral-900 py-3.5 text-base font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Đăng ký tập với PT
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
