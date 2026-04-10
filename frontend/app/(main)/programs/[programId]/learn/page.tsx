'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Input, InputNumber, Modal, Progress, Result, Spin, message } from 'antd';
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';

import {
  createWorkoutHistory,
  getMyPurchasePackages,
  getPrograms,
} from '@/app/services/api';
import { useAuthStore } from '@/app/stores/authStore';
import type {
  CreateWorkoutHistoryRequest,
  MyPurchasePackage,
  MyPurchasePackagesResponse,
  Program,
  ProgramDay,
  ProgramDayExercise,
  ProgramsResponse,
} from '@/app/types/types';
import { formatDayOfWeekVietnamese } from '@/app/utils/common';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';

type DurationMap = Record<string, number>;

function sortDays(days: ProgramDay[]) {
  return [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

function sortExercises(items: ProgramDayExercise[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function formatSeconds(total: number) {
  const safe = Math.max(0, total);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ProgramLearnPage() {
  const router = useRouter();
  const params = useParams<{ programId: string }>();
  const searchParams = useSearchParams();
  const { isLoggedIn } = useAuthStore();
  const programId = params?.programId;
  const dayIdFromQuery = searchParams.get('dayId');

  const [openSidebar, setOpenSidebar] = useState(true);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [durationMap, setDurationMap] = useState<DurationMap>({});
  const [durationsReady, setDurationsReady] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>([]);
  const [confirmedDayIds, setConfirmedDayIds] = useState<string[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const { data, isLoading, isError } = useQuery<ProgramsResponse>({
    queryKey: ['programs', 'learn-detail', programId],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 200 }),
    enabled: Boolean(programId),
  });

  const { data: purchasesRes } = useQuery<MyPurchasePackagesResponse>({
    queryKey: ['my-packages', 'for-learning'],
    queryFn: () => getMyPurchasePackages(),
    enabled: isLoggedIn,
  });

  const program: Program | undefined = useMemo(
    () => (data?.data ?? []).find((p) => p.id === programId),
    [data?.data, programId],
  );

  const sortedDays = useMemo(() => sortDays(program?.days ?? []), [program?.days]);

  const allLessons = useMemo(
    () =>
      sortedDays.flatMap((day) =>
        sortExercises(day.exercises ?? []).map((row) => ({
          day,
          row,
        })),
      ),
    [sortedDays],
  );

  useEffect(() => {
    if (!sortedDays.length) return;
    setActiveDayId((prev) => {
      if (prev && sortedDays.some((day) => day.id === prev)) return prev;
      if (dayIdFromQuery && sortedDays.some((day) => day.id === dayIdFromQuery)) {
        return dayIdFromQuery;
      }
      return sortedDays[0].id;
    });
  }, [dayIdFromQuery, sortedDays]);

  const currentDay = useMemo(
    () => sortedDays.find((day) => day.id === activeDayId) ?? sortedDays[0] ?? null,
    [sortedDays, activeDayId],
  );

  const currentDayLessons = useMemo(
    () => sortExercises(currentDay?.exercises ?? []),
    [currentDay],
  );

  useEffect(() => {
    if (!currentDayLessons.length) {
      setActiveExerciseId(null);
      return;
    }
    setActiveExerciseId((prev) => {
      if (prev && currentDayLessons.some((row) => row.id === prev)) return prev;
      return currentDayLessons[0].id;
    });
  }, [currentDayLessons]);

  const selectedLesson = useMemo(() => {
    if (!currentDayLessons.length) return null;
    return (
      currentDayLessons.find((row) => row.id === activeExerciseId) ?? currentDayLessons[0]
    );
  }, [currentDayLessons, activeExerciseId]);

  const currentExercise = selectedLesson?.exercise ?? null;

  const currentDayCompletedCount = useMemo(
    () =>
      currentDayLessons.filter((row) => completedLessonIds.includes(row.id)).length,
    [currentDayLessons, completedLessonIds],
  );

  const currentDayPercent =
    currentDayLessons.length > 0
      ? Math.round((currentDayCompletedCount / currentDayLessons.length) * 100)
      : 0;

  const activePackageMatch = useMemo(() => {
    const packages: MyPurchasePackage[] = purchasesRes?.data ?? [];
    return (
      packages.find(
        (pkg) => pkg.status === 'ACTIVE' && pkg.programId === program?.id,
      ) ?? null
    );
  }, [purchasesRes?.data, program?.id]);

  useEffect(() => {
    if (typeof window === 'undefined' || !programId || !allLessons.length) return;

    const durationKey = `program-learn:${programId}:durations`;
    const completedKey = `program-learn:${programId}:completed`;

    const savedDurationsRaw = window.sessionStorage.getItem(durationKey);
    const savedCompletedRaw = window.sessionStorage.getItem(completedKey);

    const fallback = Object.fromEntries(
      allLessons.map((item) => [item.row.id, 10]),
    ) as DurationMap;

    let nextDurations = fallback;
    let validDurationMap = false;

    if (savedDurationsRaw) {
      try {
        const parsed = JSON.parse(savedDurationsRaw) as DurationMap;
        validDurationMap = allLessons.every(
          (item) => typeof parsed[item.row.id] === 'number' && parsed[item.row.id] > 0,
        );
        if (validDurationMap) {
          nextDurations = parsed;
        }
      } catch {
        validDurationMap = false;
      }
    }

    setDurationMap(nextDurations);

    if (savedCompletedRaw) {
      try {
        const parsed = JSON.parse(savedCompletedRaw) as string[];
        const validIds = new Set(allLessons.map((item) => item.row.id));
        setCompletedLessonIds(parsed.filter((id) => validIds.has(id)));
      } catch {
        setCompletedLessonIds([]);
      }
    }

    setDurationsReady(true);
    setSetupOpen(!validDurationMap);
  }, [allLessons, programId]);

  useEffect(() => {
    if (!durationsReady || typeof window === 'undefined' || !programId) return;
    window.sessionStorage.setItem(
      `program-learn:${programId}:durations`,
      JSON.stringify(durationMap),
    );
  }, [durationMap, durationsReady, programId]);

  useEffect(() => {
    if (!durationsReady || typeof window === 'undefined' || !programId) return;
    window.sessionStorage.setItem(
      `program-learn:${programId}:completed`,
      JSON.stringify(completedLessonIds),
    );
  }, [completedLessonIds, durationsReady, programId]);

  useEffect(() => {
    if (!selectedLesson || !durationsReady) return;
    setTimerRunning(false);
    setRemainingSeconds((durationMap[selectedLesson.id] ?? 10) * 60);
  }, [selectedLesson, durationMap, durationsReady]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (!currentDay || confirmedDayIds.includes(currentDay.id)) return;
    if (
      currentDayLessons.length > 0 &&
      currentDayLessons.every((row) => completedLessonIds.includes(row.id))
    ) {
      setConfirmModalOpen(true);
    }
  }, [completedLessonIds, confirmedDayIds, currentDay, currentDayLessons]);

  const { mutate: confirmWorkout, isPending: isConfirmingWorkout } = useMutation({
    mutationFn: (payload: CreateWorkoutHistoryRequest) => createWorkoutHistory(payload),
    onSuccess: () => {
      if (currentDay) {
        setConfirmedDayIds((prev) =>
          prev.includes(currentDay.id) ? prev : [...prev, currentDay.id],
        );
      }
      setConfirmModalOpen(false);
      setCompletionNote('');
      message.success('Đã xác nhận hoàn thành buổi tập');
    },
    onError: () => {
      message.error('Không thể lưu lịch sử buổi tập. Vui lòng thử lại.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Result
          status="404"
          title="Không tìm thấy chương trình"
          subTitle="Chương trình có thể đã bị xóa hoặc chưa khả dụng."
        />
      </div>
    );
  }

  const canSyncWorkout = Boolean(activePackageMatch?.id && currentDay?.id);

  const handleMarkCurrentLessonComplete = () => {
    if (!selectedLesson) return;
    setCompletedLessonIds((prev) =>
      prev.includes(selectedLesson.id) ? prev : [...prev, selectedLesson.id],
    );

    const nextIncomplete = currentDayLessons.find(
      (row) =>
        row.id !== selectedLesson.id && !completedLessonIds.includes(row.id),
    );
    if (nextIncomplete) {
      setActiveExerciseId(nextIncomplete.id);
    }
  };

  const handleConfirmWorkout = () => {
    if (!currentDay) return;

    if (!canSyncWorkout || !activePackageMatch?.id) {
      setConfirmedDayIds((prev) =>
        prev.includes(currentDay.id) ? prev : [...prev, currentDay.id],
      );
      setConfirmModalOpen(false);
      setCompletionNote('');
      message.success(
        'Đã xác nhận hoàn thành buổi tập. Chưa thể đồng bộ lịch sử vì chương trình này chưa gắn với gói active.',
      );
      return;
    }

    confirmWorkout({
      userPackageId: activePackageMatch.id,
      programDayId: currentDay.id,
      workoutAt: new Date().toISOString(),
      status: 'COMPLETED',
      note: completionNote.trim() || null,
    });
  };

  const resetCurrentTimer = () => {
    if (!selectedLesson) return;
    setTimerRunning(false);
    setRemainingSeconds((durationMap[selectedLesson.id] ?? 10) * 60);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="border-b border-neutral-800 bg-black/80">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-1 text-xs text-neutral-400 hover:text-white"
            >
              ← Quay lại chương trình
            </button>
            <h1 className="truncate text-lg font-semibold">{program.name}</h1>
            <p className="truncate text-xs text-neutral-400">
              {levelLabels[program.level]} · {program.daysPerWeek} ngày/tuần
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setSetupOpen(true)}>Chỉnh thời gian</Button>
            <Button
              type="primary"
              className="bg-violet-600!"
              onClick={() => setConfirmModalOpen(true)}
              disabled={!currentDay}
            >
              Xác nhận hoàn thành buổi tập
            </Button>
            <button
              type="button"
              onClick={() => setOpenSidebar((v) => !v)}
              className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm hover:bg-neutral-800"
            >
              {openSidebar ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="border-r border-neutral-800 p-4 lg:p-6">
          <div className="overflow-hidden rounded border border-neutral-800 bg-black">
            <div className="aspect-video bg-neutral-900">
              {currentExercise?.videoUrl ? (
                <iframe
                  src={currentExercise.videoUrl}
                  title={currentExercise.name}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                  Bài tập này chưa có video hướng dẫn.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <PlayCircleOutlined />
                <span>Nội dung bài học</span>
              </div>
              <div className="text-xs text-neutral-400">
                {currentDay ? formatDayOfWeekVietnamese(currentDay.dayOfWeek) : 'Đang cập nhật'}
              </div>
            </div>

            <h2 className="text-2xl font-semibold">
              {currentExercise?.name ?? 'Chưa có bài tập'}
            </h2>

            <div className="mt-4 rounded border border-neutral-700 bg-neutral-950 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-neutral-400">
                    <ClockCircleOutlined />
                    <span>Thời gian bài hiện tại</span>
                  </div>
                  <p className="mt-1 text-3xl font-semibold">
                    {formatSeconds(remainingSeconds)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Mục tiêu: {selectedLesson ? durationMap[selectedLesson.id] ?? 10 : 0} phút
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    className="bg-violet-600!"
                    onClick={() => setTimerRunning(true)}
                    disabled={!selectedLesson || timerRunning}
                  >
                    Bắt đầu
                  </Button>
                  <Button
                    icon={<PauseCircleOutlined />}
                    onClick={() => setTimerRunning(false)}
                    disabled={!timerRunning}
                  >
                    Tạm dừng
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={resetCurrentTimer}>
                    Đặt lại
                  </Button>
                </div>
              </div>
              <Progress
                percent={currentDayPercent}
                showInfo={false}
                strokeColor="#8b5cf6"
                trailColor="#262626"
              />
              <p className="mt-2 text-xs text-neutral-400">
                Hoàn thành {currentDayCompletedCount}/{currentDayLessons.length} bài trong buổi này
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-neutral-800 px-2 py-1">
                {currentExercise
                  ? muscleGroupLabels[currentExercise.muscleGroup]
                  : 'Đang cập nhật'}
              </span>
              <span className="rounded bg-neutral-800 px-2 py-1">
                {currentExercise ? levelLabels[currentExercise.level] : 'Đang cập nhật'}
              </span>
              <span className="rounded bg-neutral-800 px-2 py-1">
                {currentExercise?.equipments || 'Đang cập nhật'}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-300">
              {currentExercise?.description || 'Đang cập nhật'}
            </p>
            {currentExercise?.content ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-400">
                {currentExercise.content}
              </p>
            ) : null}
            {currentExercise?.suggestion ? (
              <div className="mt-4 rounded border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-300">
                <span className="font-semibold text-white">Gợi ý:</span>{' '}
                {currentExercise.suggestion}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                type="primary"
                className="bg-green-600!"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkCurrentLessonComplete}
                disabled={!selectedLesson || completedLessonIds.includes(selectedLesson.id)}
              >
                {selectedLesson && completedLessonIds.includes(selectedLesson.id)
                  ? 'Đã hoàn thành bài này'
                  : 'Hoàn thành bài hiện tại'}
              </Button>
              <Button onClick={() => setConfirmModalOpen(true)}>
                Xác nhận hoàn thành buổi tập
              </Button>
            </div>
          </div>
        </main>

        <aside
          className={`${openSidebar ? 'block' : 'hidden'} border-t border-neutral-800 bg-neutral-900 lg:block lg:border-t-0`}
        >
          <div className="border-b border-neutral-800 p-4">
            <h3 className="text-base font-semibold">Nội dung chương trình</h3>
            <p className="mt-1 text-xs text-neutral-400">
              {allLessons.length} bài tập · Buổi hiện tại {currentDayPercent}%
            </p>
          </div>

          <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
            {sortedDays.length === 0 ? (
              <p className="p-4 text-sm text-neutral-400">Đang cập nhật lịch tập.</p>
            ) : (
              sortedDays.map((day) => {
                const rows = sortExercises(day.exercises ?? []);
                const isActiveDay = currentDay?.id === day.id;
                return (
                  <div key={day.id} className="border-b border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setActiveDayId(day.id)}
                      className={`w-full px-4 py-3 text-left transition ${
                        isActiveDay ? 'bg-neutral-800' : 'hover:bg-neutral-800/60'
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {formatDayOfWeekVietnamese(day.dayOfWeek)}
                      </p>
                      <p className="text-xs text-neutral-400">{day.title}</p>
                    </button>

                    <div className="pb-2">
                      {rows.length === 0 ? (
                        <p className="px-4 py-2 text-xs text-neutral-500">Đang cập nhật</p>
                      ) : (
                        rows.map((row) => {
                          const isCurrent = selectedLesson?.id === row.id;
                          const isDone = completedLessonIds.includes(row.id);
                          return (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() => {
                                setActiveDayId(day.id);
                                setActiveExerciseId(row.id);
                              }}
                              className={`flex w-full items-start gap-2 px-5 py-2.5 text-left text-sm transition ${
                                isCurrent
                                  ? 'bg-violet-600/20 text-white'
                                  : 'text-neutral-300 hover:bg-neutral-800/60'
                              }`}
                            >
                              {isDone ? (
                                <CheckCircleOutlined className="mt-0.5 text-green-400" />
                              ) : (
                                <CaretRightOutlined className="mt-0.5 text-neutral-500" />
                              )}
                              <div className="min-w-0">
                                <span className="line-clamp-2">
                                  {row.sortOrder}. {row.exercise.name}
                                </span>
                                <div className="mt-0.5 text-xs text-neutral-500">
                                  {durationMap[row.id] ?? 10} phút
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      <Modal
        title="Thiết lập thời gian cho từng bài tập"
        open={setupOpen}
        closable={durationsReady}
        maskClosable={durationsReady}
        cancelButtonProps={{ style: durationsReady ? undefined : { display: 'none' } }}
        onCancel={() => setSetupOpen(false)}
        onOk={() => setSetupOpen(false)}
        okText="Bắt đầu tập"
        cancelText="Hủy"
        width={760}
      >
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {sortedDays.map((day) => {
            const rows = sortExercises(day.exercises ?? []);
            return (
              <div key={day.id} className="mb-5 rounded-xl border border-neutral-200 p-4">
                <p className="font-semibold text-neutral-900">
                  {formatDayOfWeekVietnamese(day.dayOfWeek)} - {day.title}
                </p>
                {day.note ? (
                  <p className="mt-1 text-sm text-neutral-500">{day.note}</p>
                ) : null}
                <div className="mt-3 space-y-3">
                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-neutral-50 p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900">
                          {row.sortOrder}. {row.exercise.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {muscleGroupLabels[row.exercise.muscleGroup]} ·{' '}
                          {levelLabels[row.exercise.level]}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <span className="text-sm text-neutral-500">Phút</span>
                        <InputNumber
                          min={1}
                          max={180}
                          value={durationMap[row.id] ?? 10}
                          onChange={(value) =>
                            setDurationMap((prev) => ({
                              ...prev,
                              [row.id]: Number(value ?? 10),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <Modal
        title="Xác nhận hoàn thành buổi tập"
        open={confirmModalOpen}
        onCancel={() => setConfirmModalOpen(false)}
        onOk={handleConfirmWorkout}
        okText="Xác nhận hoàn thành"
        cancelText="Để sau"
        confirmLoading={isConfirmingWorkout}
      >
        <p className="mb-3 text-sm text-neutral-600">
          {currentDay
            ? `Bạn xác nhận đã hoàn thành buổi "${currentDay.title}"?`
            : 'Xác nhận hoàn thành buổi tập?'}
        </p>
        {!canSyncWorkout ? (
          <p className="mb-3 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
            Chương trình này chưa gắn với gói active nên hệ thống chưa thể đồng bộ lịch sử workout qua API.
          </p>
        ) : null}
        <Input.TextArea
          rows={4}
          value={completionNote}
          onChange={(e) => setCompletionNote(e.target.value)}
          placeholder="Ghi chú buổi tập (không bắt buộc)"
        />
      </Modal>
    </div>
  );
}

