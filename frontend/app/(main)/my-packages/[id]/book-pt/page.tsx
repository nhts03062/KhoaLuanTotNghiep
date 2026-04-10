'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Form,
  Input,
  Result,
  Spin,
  Tag,
  message,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

import {
  createPtAssistRequest,
  getAvailablePTs,
  getMyPurchasePackages,
  getPtWeekBookingGrid,
} from '@/app/services/api';
import type {
  AvailablePtAccount,
  CreatePtAssistRequestRequest,
  MyPurchasePackage,
  MyPurchasePackagesResponse,
  PtWeekBookingGridResponse,
  PtWeekGridCell,
} from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';
import SelectPtStep from '@/app/components/purchase/SelectPtStep';
import {
  filterAvailablePtsByBuoi,
  type PtShiftBuoiFilter,
} from '@/app/lib/ptShiftClientFilter';

dayjs.extend(isoWeek);

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật',
};

const STANDARD_GRID_KEYS = new Set([
  'R06',
  'R08',
  'R10',
  'R13',
  'R15',
  'R17',
  'R19',
]);

interface SelectedCell {
  weeklySlotId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
}

export default function BookPtSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isLoggedIn, loading: authLoading } = useAuthStore();
  const userPackageId = params?.id;

  const [selectedPtId, setSelectedPtId] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [ptSearch, setPtSearch] = useState('');
  const [ptFromDate, setPtFromDate] = useState<string | undefined>(undefined);
  const [ptToDate, setPtToDate] = useState<string | undefined>(undefined);
  const [ptShiftBuoi, setPtShiftBuoi] = useState<PtShiftBuoiFilter>('all');
  const [weekStart, setWeekStart] = useState<dayjs.Dayjs>(() =>
    dayjs().startOf('isoWeek'),
  );
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const { data: myPkgRes, isLoading: isLoadingMyPkg } =
    useQuery<MyPurchasePackagesResponse>({
      queryKey: ['my-packages'],
      queryFn: () => getMyPurchasePackages(),
      enabled: isLoggedIn,
    });

  const userPackage: MyPurchasePackage | null = useMemo(() => {
    const list = myPkgRes?.data ?? [];
    return list.find((p) => p.id === userPackageId) ?? null;
  }, [myPkgRes?.data, userPackageId]);

  const branchId = userPackage?.branchId;

  const { data: ptsRes, isLoading: isLoadingPts } = useQuery({
    queryKey: [
      'available-pts-book',
      branchId,
      ptFromDate,
      ptToDate,
      ptSearch,
    ],
    queryFn: () =>
      getAvailablePTs({
        branchId: branchId as string,
        from: ptFromDate,
        to: ptToDate,
        search: ptSearch || undefined,
      }),
    enabled: isLoggedIn && !!branchId,
  });

  const pts: AvailablePtAccount[] = ptsRes?.data ?? [];

  const filteredPts = useMemo(
    () =>
      filterAvailablePtsByBuoi(pts, ptShiftBuoi, {
        from: ptFromDate,
        to: ptToDate,
      }),
    [pts, ptShiftBuoi, ptFromDate, ptToDate],
  );

  useEffect(() => {
    if (!selectedPtId) return;
    if (!filteredPts.some((p) => p.id === selectedPtId)) {
      setSelectedPtId(null);
    }
  }, [selectedPtId, filteredPts]);

  const selectedPt = useMemo(
    () => pts.find((pt) => pt.id === selectedPtId) ?? null,
    [pts, selectedPtId],
  );

  useEffect(() => {
    setSelectedCell(null);
  }, [selectedPtId, branchId]);

  const weekStartYmd = weekStart.format('YYYY-MM-DD');

  const { data: weekGridRes, isLoading: isLoadingGrid } =
    useQuery<PtWeekBookingGridResponse>({
      queryKey: ['pt-week-grid', selectedPtId, branchId, weekStartYmd],
      queryFn: () =>
        getPtWeekBookingGrid({
          branchId: branchId as string,
          ptAccountId: selectedPtId as string,
          weekStart: weekStartYmd,
        }),
      enabled: isLoggedIn && !!branchId && !!selectedPtId,
    });

  const gridRows = weekGridRes?.data?.gridRows ?? [];
  const days = weekGridRes?.data?.days ?? [];
  const visibleRows = useMemo(
    () => gridRows.filter((r) => STANDARD_GRID_KEYS.has(r.key)),
    [gridRows],
  );

  const { mutate: submitBooking, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: CreatePtAssistRequestRequest) =>
      createPtAssistRequest(payload),
    onSuccess: () => {
      message.success('Đã gửi yêu cầu đặt buổi PT');
      router.push('/my-packages');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Không thể đặt buổi. Vui lòng thử lại.';
      message.error(typeof msg === 'string' ? msg : 'Đặt buổi thất bại');
    },
  });

  const remaining =
    typeof userPackage?.ptSessionsRemaining === 'number'
      ? userPackage.ptSessionsRemaining
      : null;

  const granted =
    userPackage?.ptSessionsGranted ??
    userPackage?.package?.ptSessionsIncluded ??
    0;

  const outOfQuota = remaining !== null && remaining <= 0;

  const todayIsoWeekStart = dayjs().startOf('isoWeek');
  const canGoPrev = weekStart.isAfter(todayIsoWeekStart, 'day');

  const handleClickCell = (date: string, cell: PtWeekGridCell) => {
    if (cell.state !== 'FREE' || !cell.weeklySlotId) return;
    setSelectedCell({
      weeklySlotId: cell.weeklySlotId,
      sessionDate: date,
      startTime: cell.startTime,
      endTime: cell.endTime,
    });
  };

  const goPrevWeek = () => {
    if (!canGoPrev) return;
    setWeekStart((prev) => prev.subtract(1, 'week'));
    setSelectedCell(null);
  };

  const goNextWeek = () => {
    setWeekStart((prev) => prev.add(1, 'week'));
    setSelectedCell(null);
  };

  const canSubmit =
    !!userPackageId &&
    !!selectedCell &&
    !outOfQuota &&
    userPackage?.status === 'ACTIVE';

  const handleSubmit = () => {
    if (!canSubmit || !selectedCell || !userPackageId) return;
    submitBooking({
      userPackageId,
      slotId: selectedCell.weeklySlotId,
      sessionDate: selectedCell.sessionDate,
      note: note.trim() || undefined,
    });
  };

  if (authLoading || isLoadingMyPkg) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!userPackage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Result
          status="404"
          title="Không tìm thấy gói tập"
          subTitle="Gói tập có thể đã bị xoá hoặc không thuộc về bạn."
          extra={
            <Button type="primary" onClick={() => router.push('/my-packages')}>
              Về Gói tập của tôi
            </Button>
          }
        />
      </div>
    );
  }

  if (!userPackage.package.hasPt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Result
          status="warning"
          title="Gói này không bao gồm PT"
          extra={
            <Button type="primary" onClick={() => router.push('/my-packages')}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 pt-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
        >
          ← Quay lại
        </button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Đặt buổi tập với PT
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Gói {userPackage.package.name} · Chi nhánh{' '}
              {userPackage.branch.name}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm">
            Buổi PT còn lại:{' '}
            <span className="font-semibold text-neutral-900">
              {remaining ?? '—'}
            </span>{' '}
            / <span className="font-semibold">{granted || '—'}</span>
          </div>
        </div>

        {outOfQuota ? (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message="Bạn đã hết số buổi PT của gói này."
            description="Hãy đợi PT từ chối/hủy các buổi PENDING hoặc đăng ký gói mới."
          />
        ) : null}

        {userPackage.status !== 'ACTIVE' ? (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message="Gói tập chưa kích hoạt"
            description="Bạn chỉ có thể đặt buổi PT khi gói đang ở trạng thái ACTIVE."
          />
        ) : null}

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <SelectPtStep
            loading={isLoadingPts}
            pts={filteredPts}
            selectedPtId={selectedPtId}
            onSelect={(pt) => setSelectedPtId(pt.id)}
            search={ptSearch}
            fromDate={ptFromDate}
            toDate={ptToDate}
            shiftBuoi={ptShiftBuoi}
            onShiftBuoiChange={setPtShiftBuoi}
            onSearchChange={(v) => setPtSearch(v)}
            onDateRangeChange={(from, to) => {
              setPtFromDate(from);
              setPtToDate(to);
            }}
          />
        </div>

        {selectedPt ? (
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-white">
                Chọn khung giờ với{' '}
                {selectedPt.profile?.name || selectedPt.email}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  size="small"
                  icon={<LeftOutlined />}
                  disabled={!canGoPrev}
                  onClick={goPrevWeek}
                  className="border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500! hover:text-white!"
                >
                  Tuần trước
                </Button>
                <span className="text-sm font-semibold text-neutral-200">
                  {weekStart.format('DD/MM')} –{' '}
                  {weekStart.add(6, 'day').format('DD/MM/YYYY')}
                </span>
                <Button
                  size="small"
                  onClick={goNextWeek}
                  className="border-neutral-700 bg-neutral-900 text-neutral-100 hover:border-neutral-500! hover:text-white!"
                >
                  Tuần sau
                  <RightOutlined />
                </Button>
              </div>
            </div>

            {isLoadingGrid ? (
              <div className="flex h-64 items-center justify-center">
                <Spin />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="grid min-w-[840px] grid-cols-7 gap-2">
                  {days.map((day) => (
                    <div
                      key={`hd-${day.date}`}
                      className="rounded-lg bg-neutral-900 px-2 py-3 text-center"
                    >
                      <div className="text-sm font-semibold text-white">
                        {DAY_OF_WEEK_LABELS[day.dayOfWeek]}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {dayjs(day.date).format('D/M')}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-2 grid min-w-[840px] grid-cols-7 gap-2">
                  {visibleRows.map((row) =>
                    days.map((day) => {
                      const cell = day.slots.find(
                        (s) => s.gridKey === row.key,
                      );
                      const state = cell?.state ?? 'UNAVAILABLE';
                      const isSelected =
                        !!cell &&
                        selectedCell?.weeklySlotId === cell.weeklySlotId &&
                        selectedCell?.sessionDate === day.date;
                      const isFreeQuotaOk = state === 'FREE' && !outOfQuota;
                      const clickable = isFreeQuotaOk;

                      let stateClasses =
                        'border-neutral-800 bg-neutral-900/40 text-neutral-600';
                      let label: string = '—';

                      if (state === 'PASSED') {
                        stateClasses =
                          'border-neutral-800 bg-neutral-900/60 text-neutral-500';
                        label = 'ĐÃ QUA';
                      } else if (state === 'OCCUPIED') {
                        stateClasses =
                          'border-rose-900/60 bg-rose-950/40 text-rose-300';
                        label = 'ĐÃ ĐẶT';
                      } else if (state === 'FREE') {
                        if (outOfQuota) {
                          stateClasses =
                            'border-neutral-800 bg-neutral-900/60 text-neutral-500';
                          label = 'HẾT BUỔI';
                        } else {
                          stateClasses =
                            'border-neutral-700 bg-neutral-900 text-white hover:border-emerald-500 hover:bg-neutral-800';
                          label = `${remaining ?? 0} BUỔI`;
                        }
                      }

                      if (isSelected) {
                        stateClasses =
                          'border-emerald-400 bg-emerald-500/10 text-emerald-100 ring-2 ring-emerald-500/40';
                      }

                      return (
                        <button
                          key={`${row.key}-${day.date}`}
                          type="button"
                          disabled={!clickable}
                          onClick={() => cell && handleClickCell(day.date, cell)}
                          className={`flex h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border text-[11px] font-semibold uppercase tracking-wide transition-colors ${stateClasses} ${
                            clickable ? 'cursor-pointer' : 'cursor-not-allowed'
                          }`}
                        >
                          <span className="text-sm font-bold tracking-normal">
                            {row.startTime} - {row.endTime}
                          </span>
                          <span className="text-[10px] font-semibold">
                            {label}
                          </span>
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {selectedCell ? (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Thông tin buổi tập
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <Tag color="blue" className="m-0!">
                {dayjs(selectedCell.sessionDate).format('dddd, DD/MM/YYYY')}
              </Tag>
              <Tag color="geekblue" className="m-0!">
                {selectedCell.startTime} – {selectedCell.endTime}
              </Tag>
            </div>
            <Form layout="vertical">
              <Form.Item label="Ghi chú" className="mb-0">
                <Input.TextArea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mong muốn của bạn cho buổi tập (tuỳ chọn)"
                />
              </Form.Item>
            </Form>
          </div>
        ) : null}

        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/90 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
            <Button onClick={() => router.back()}>Hủy</Button>
            <Button
              type="primary"
              loading={isSubmitting}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Gửi yêu cầu đặt buổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
