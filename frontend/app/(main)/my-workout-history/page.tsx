'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, DatePicker, Result, Spin } from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  FireOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';

import { getListWorkoutHistory } from '@/app/services/api';
import { appRoute } from '@/app/config/appRoute';
import { useAuthStore } from '@/app/stores/authStore';
import type { ListWorkoutHistoryResponse, WorkoutHistory } from '@/app/types/types';

type StatusFilter = 'ALL' | 'COMPLETED' | 'SKIPPED';

function statusLabel(status: string) {
  if (status === 'COMPLETED') return 'Hoàn thành';
  if (status === 'SKIPPED') return 'Vắng mặt';
  return status;
}

function statusClass(status: string) {
  if (status === 'COMPLETED') return 'bg-green-900/40 text-green-300 border-green-800';
  if (status === 'SKIPPED') return 'bg-amber-900/30 text-amber-300 border-amber-700';
  return 'bg-neutral-800 text-neutral-300 border-neutral-700';
}

export default function MyWorkoutHistoryPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuthStore();
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const from = fromDate ? fromDate.format('YYYY-MM-DD') : undefined;
  const to = toDate ? toDate.format('YYYY-MM-DD') : undefined;

  const { data, isLoading, isError } = useQuery<ListWorkoutHistoryResponse>({
    queryKey: ['my-workout-history', from, to],
    queryFn: () => getListWorkoutHistory({ from, to }),
    enabled: isLoggedIn,
  });

  const histories = useMemo(() => {
    const list: WorkoutHistory[] = data?.data ?? [];
    return list.filter((item) => {
      if (statusFilter === 'ALL') return true;
      return item.status === statusFilter;
    });
  }, [data?.data, statusFilter]);

  const clearFilter = () => {
    setFromDate(null);
    setToDate(null);
    setStatusFilter('ALL');
  };

  if (!isLoggedIn && !authLoading) {
    return (
      <Result
        status="warning"
        title="Vui lòng đăng nhập để xem lịch sử tập luyện"
      />
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-neutral-950">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 pb-16 pt-8 text-white">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 text-sm text-neutral-400 hover:text-white"
        >
          ←
        </button>

        <h1 className="text-4xl font-bold tracking-tight">Lịch sử tập luyện</h1>
        <p className="mt-2 text-neutral-400">
          Theo dõi lịch sử và tiến độ tập luyện của bạn
        </p>

        <div className="mt-7 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <p className="mb-1 text-xs text-neutral-400">Từ ngày</p>
              <DatePicker
                value={fromDate}
                onChange={(d) => setFromDate(d)}
                format="DD/MM/YYYY"
                className="w-full"
                style={{ backgroundColor: '#0f1115', borderColor: '#262a33', color: 'white' }}
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-neutral-400">Đến ngày</p>
              <DatePicker
                value={toDate}
                onChange={(d) => setToDate(d)}
                format="DD/MM/YYYY"
                className="w-full"
                style={{ backgroundColor: '#0f1115', borderColor: '#262a33', color: 'white' }}
              />
            </div>
            <div className="flex items-end">
              <Button danger type="primary" onClick={clearFilter}>
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          <div className="mt-4 inline-flex overflow-hidden rounded-lg border border-neutral-800">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'COMPLETED', label: 'Hoàn thành' },
              { key: 'SKIPPED', label: 'Vắng mặt' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key as StatusFilter)}
                className={`px-5 py-2 text-sm font-medium transition ${
                  statusFilter === tab.key
                    ? 'bg-red-500 text-white'
                    : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isError ? (
          <div className="mt-4 rounded-xl border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Không tải được lịch sử tập luyện. Vui lòng thử lại.
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {histories.length === 0 ? (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center text-neutral-400">
              Chưa có dữ liệu lịch sử tập luyện.
            </div>
          ) : (
            histories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  router.push(
                    `${appRoute.home.programLearn(item.program.id)}?dayId=${item.programDay.id}`,
                  )
                }
                className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-left transition hover:border-neutral-600 hover:bg-neutral-900/90"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
                      <CalendarOutlined />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">
                        {item.programDay.title || item.program.name}
                      </h3>
                      <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarOutlined />
                          {dayjs(item.workoutAt).format('DD/MM/YYYY')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ClockCircleOutlined />
                          {dayjs(item.workoutAt).format('HH:mm')}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-neutral-800 pt-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-xl bg-neutral-800/70 p-3">
                    <UserOutlined className="text-neutral-300" />
                    <div>
                      <p className="text-xs text-neutral-400">Chương trình</p>
                      <p className="text-sm font-semibold text-white">{item.program.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-neutral-800/70 p-3">
                    <FireOutlined className="text-orange-300" />
                    <div>
                      <p className="text-xs text-neutral-400">Buổi trong tuần</p>
                      <p className="text-sm font-semibold text-white">
                        {item.programDay.dayOfWeek} - {item.programDay.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-neutral-800/70 p-3">
                    <StarOutlined className="text-yellow-300" />
                    <div>
                      <p className="text-xs text-neutral-400">Ghi chú</p>
                      <p className="text-sm font-semibold text-white">
                        {item.note?.trim() || 'Chưa cập nhật'}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

