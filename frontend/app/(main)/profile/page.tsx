'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Select,
  Spin,
  message,
} from 'antd';
import {
  AimOutlined,
  PlusOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ColumnHeightOutlined,
  PhoneOutlined,
  PieChartOutlined,
  StockOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { AxiosError } from 'axios';

import { profileFieldRules } from '@/app/lib/profileValidation';
import {
  createExercise,
  createProgram,
  getCheckInHistory,
  getProfile,
  getPTAssistRequests,
  getPTAssistSchedule,
  getTodayExercise,
  getPTTrainingHistory,
  updateProfile,
} from '@/app/services/api';
import type {
  CheckInHistoryItem,
  CheckInHistoryResponse,
  CreateExerciseRequest,
  Profile,
  ProfileResponse,
  ProgramRequest,
  PTAssistRequest,
  PTAssistSchedule,
  PTAssistSchedulesResponse,
  PTAssistRequestsResponse,
  PTTrainingHistoriesResponse,
  PTTrainingHistory,
  TodayExcerciseResponse,
  UpdateProfileRequest,
} from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';
import { appRoute } from '@/app/config/appRoute';

function BentoCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function normalizeDateKey(key: string): string {
  const slice = key.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(slice)) return slice;
  return dayjs(key).format('YYYY-MM-DD');
}

function totalCheckInsFromGrouped(
  raw: Record<string, CheckInHistoryItem[]>,
): number {
  let n = 0;
  for (const items of Object.values(raw)) {
    n += items.length;
  }
  return n;
}

function computeCheckInStreak(
  raw: Record<string, CheckInHistoryItem[]>,
): number {
  const keys = Object.keys(raw).map(normalizeDateKey);
  if (keys.length === 0) return 0;
  const set = new Set(keys);

  let start = dayjs().startOf('day');
  if (!set.has(start.format('YYYY-MM-DD'))) {
    start = start.subtract(1, 'day');
  }
  if (!set.has(start.format('YYYY-MM-DD'))) {
    return 0;
  }

  let streak = 0;
  let d = start;
  while (set.has(d.format('YYYY-MM-DD'))) {
    streak += 1;
    d = d.subtract(1, 'day');
  }
  return streak;
}

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Thiếu cân';
  if (bmi < 25) return 'Bình thường';
  if (bmi < 30) return 'Thừa cân';
  return 'Béo phì';
}

function fitnessGoalLabel(goal: string | null): string | null {
  if (!goal) return null;
  const map: Record<string, string> = {
    LOSE_WEIGHT: 'Giảm cân',
    GAIN_MUSCLE: 'Tăng cơ',
    IMPROVE_HEALTH: 'Cải thiện sức khỏe',
    MAINTAIN_WEIGHT: 'Duy trì cân nặng',
  };
  return map[goal] ?? goal;
}

function genderLabel(g: string | null): string | null {
  if (!g) return null;
  if (g === 'MALE') return 'Nam';
  if (g === 'FEMALE') return 'Nữ';
  return g;
}

function pendingRequestToSchedule(req: PTAssistRequest): PTAssistSchedule {
  const name = req.account.profile?.name ?? req.account.email;
  return {
    id: req.id,
    title: `${name} - ${req.branch.name}`,
    start: req.startTime,
    end: req.endTime,
    allDay: false,
    extendedProps: {
      status: 'PENDING',
      note: req.note,
      rejectReason: req.rejectReason,
      account: req.account,
      branch: req.branch,
      userPackage: req.userPackage,
    },
  };
}

function filterPendingInRange(
  requests: PTAssistRequest[],
  fromIso: string,
  toIso: string,
): PTAssistRequest[] {
  const fromMs = new Date(fromIso).getTime();
  const toMs = new Date(toIso).getTime();
  return requests.filter((r) => {
    if (r.status !== 'PENDING') return false;
    const start = new Date(r.startTime).getTime();
    const end = new Date(r.endTime).getTime();
    return start < toMs && end > fromMs;
  });
}

function mergePtSchedules(
  accepted: PTAssistSchedule[],
  pendingRaw: PTAssistRequest[],
  fromIso: string,
  toIso: string,
): PTAssistSchedule[] {
  const pendingInRange = filterPendingInRange(pendingRaw, fromIso, toIso);
  const pendingAsSchedules = pendingInRange.map(pendingRequestToSchedule);
  return [...pendingAsSchedules, ...accepted];
}

function ptScheduleStatusLabel(
  status: PTAssistSchedule['extendedProps']['status'],
): string {
  const map: Record<PTAssistSchedule['extendedProps']['status'], string> = {
    PENDING: 'Chờ xác nhận',
    ACCEPTED: 'Đã xác nhận',
    REJECTED: 'Từ chối',
  };
  return map[status] ?? status;
}

const exerciseMuscleGroupOptions: {
  value: CreateExerciseRequest['muscleGroup'];
  label: string;
}[] = [
  { value: 'CHEST', label: 'Ngực' },
  { value: 'BACK', label: 'Lưng' },
  { value: 'ARMS', label: 'Tay' },
  { value: 'LEGS', label: 'Chân' },
  { value: 'ABS', label: 'Bụng' },
  { value: 'CORE', label: 'Core' },
  { value: 'CARDIO', label: 'Cardio' },
];

const levelOptions: { value: ProgramRequest['level']; label: string }[] = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

function renderUpdating(
  value: unknown,
  formatter?: (v: any) => React.ReactNode,
) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-neutral-400">Đang cập nhật</span>;
  }
  return formatter ? formatter(value) : (value as any);
}

function cleanUpdatePayload(values: any): UpdateProfileRequest {
  const payload: UpdateProfileRequest = {};

  if (typeof values.name === 'string' && values.name.trim())
    payload.name = values.name.trim();
  if (values.gender) payload.gender = values.gender;
  if (typeof values.phone === 'string' && values.phone.trim())
    payload.phone = values.phone.trim();
  if (values.dateOfBirth)
    payload.dateOfBirth = dayjs(values.dateOfBirth).toISOString();
  if (typeof values.avatar === 'string' && values.avatar.trim())
    payload.avatar = values.avatar.trim();
  if (typeof values.height === 'number') payload.height = values.height;
  if (typeof values.weight === 'number') payload.weight = values.weight;
  if (values.fitnessGoal) payload.fitnessGoal = values.fitnessGoal;

  return payload;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, loading: authLoading, user } = useAuthStore();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [createExerciseOpen, setCreateExerciseOpen] = useState(false);
  const [createProgramOpen, setCreateProgramOpen] = useState(false);
  const [createExerciseForm] = Form.useForm<CreateExerciseRequest>();
  const [createProgramForm] = Form.useForm<ProgramRequest>();
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoLoadOk, setVideoLoadOk] = useState(false);
  const [videoCheckTriggered, setVideoCheckTriggered] = useState(false);

  const { mutate: submitUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateProfile(payload),
    onSuccess: () => {
      message.success('Đã cập nhật hồ sơ');
      queryClient.invalidateQueries({ queryKey: ['account-profile'] });
      setEditOpen(false);
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ message?: string | string[] }>;
      const raw = axiosErr?.response?.data?.message;
      if (Array.isArray(raw)) {
        message.error(raw.join(', '));
      } else if (typeof raw === 'string' && raw.trim()) {
        message.error(raw);
      } else {
        message.error('Cập nhật thất bại. Vui lòng thử lại.');
      }
    },
  });

  const { mutate: submitCreateExercise, isPending: isCreatingExercise } =
    useMutation({
      mutationFn: (payload: CreateExerciseRequest) => createExercise(payload),
      onSuccess: () => {
        message.success('Đã tạo bài tập');
        setCreateExerciseOpen(false);
        setVideoPreviewUrl('');
        setVideoLoadOk(false);
        setVideoCheckTriggered(false);
        createExerciseForm.resetFields();
      },
      onError: () => {
        message.error('Không thể tạo bài tập. Vui lòng thử lại.');
      },
    });

  const { mutate: submitCreateProgram, isPending: isCreatingProgram } =
    useMutation({
      mutationFn: (payload: ProgramRequest) => createProgram(payload),
      onSuccess: () => {
        message.success('Đã tạo chương trình');
        setCreateProgramOpen(false);
        createProgramForm.resetFields();
      },
      onError: () => {
        message.error('Không thể tạo chương trình. Vui lòng thử lại.');
      },
    });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const {
    data: profileRes,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<ProfileResponse>({
    queryKey: ['account-profile'],
    queryFn: () => getProfile(),
    enabled: isLoggedIn,
  });

  const isPt = user?.role === 'PT';
  const isUser = user?.role === 'USER';

  const ptStatsRange = useMemo(
    () => ({
      from: dayjs().startOf('year').toISOString(),
      to: dayjs().endOf('year').toISOString(),
    }),
    [],
  );

  const ptTodayRange = useMemo(
    () => ({
      from: dayjs().startOf('day').toISOString(),
      to: dayjs().endOf('day').toISOString(),
    }),
    [],
  );

  const { data: checkInRes } = useQuery<CheckInHistoryResponse>({
    queryKey: ['profile-checkins'],
    queryFn: () => getCheckInHistory(),
    enabled: isLoggedIn && isUser,
  });

  const { data: ptYearScheduleRes } = useQuery<PTAssistSchedulesResponse>({
    queryKey: ['profile-pt-schedule-year', ptStatsRange.from, ptStatsRange.to],
    queryFn: () => getPTAssistSchedule(ptStatsRange),
    enabled: isLoggedIn && isPt,
  });

  const { data: ptTodayScheduleRes } = useQuery<PTAssistSchedulesResponse>({
    queryKey: ['profile-pt-schedule-today', ptTodayRange.from, ptTodayRange.to],
    queryFn: () => getPTAssistSchedule(ptTodayRange),
    enabled: isLoggedIn && isPt,
  });

  const { data: ptAssistRes } = useQuery<PTAssistRequestsResponse>({
    queryKey: ['profile-pt-assist-requests'],
    queryFn: () => getPTAssistRequests(),
    enabled: isLoggedIn && isPt,
  });

  const { data: ptHistoryRes } = useQuery<PTTrainingHistoriesResponse>({
    queryKey: ['profile-pt-history'],
    queryFn: () => getPTTrainingHistory(),
    enabled: isLoggedIn && user?.role === 'USER',
  });

  const { data: todayExerciseRes } = useQuery<TodayExcerciseResponse>({
    queryKey: ['profile-today-exercises'],
    queryFn: () => getTodayExercise(),
    enabled: isLoggedIn && user?.role === 'USER',
  });

  const profile: Profile | undefined = profileRes?.data;

  const checkInGrouped = checkInRes?.data ?? {};
  const totalCheckIns = useMemo(
    () => totalCheckInsFromGrouped(checkInGrouped),
    [checkInGrouped],
  );
  const checkInStreak = useMemo(
    () => computeCheckInStreak(checkInGrouped),
    [checkInGrouped],
  );

  const ptSessions: PTTrainingHistory[] = useMemo(() => {
    const list = ptHistoryRes?.data ?? [];
    return [...list].sort(
      (a, b) => dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
    );
  }, [ptHistoryRes?.data]);

  const ptAcceptedCount = useMemo(
    () => ptSessions.filter((s) => s.status === 'ACCEPTED').length,
    [ptSessions],
  );

  const recentPt = useMemo(() => ptSessions.slice(0, 5), [ptSessions]);
  const todayProgramDay = todayExerciseRes?.data?.programDay;
  const todayExercises = todayExerciseRes?.data?.exercises ?? [];

  const ptYearSessions = useMemo(
    () =>
      mergePtSchedules(
        ptYearScheduleRes?.data ?? [],
        ptAssistRes?.data ?? [],
        ptStatsRange.from,
        ptStatsRange.to,
      ).filter((s) => s.extendedProps.status !== 'REJECTED'),
    [
      ptYearScheduleRes?.data,
      ptAssistRes?.data,
      ptStatsRange.from,
      ptStatsRange.to,
    ],
  );

  const ptTotalTeachingSessions = ptYearSessions.length;

  const ptAcceptedTeachingCount = useMemo(
    () =>
      ptYearSessions.filter((s) => s.extendedProps.status === 'ACCEPTED')
        .length,
    [ptYearSessions],
  );

  const ptTodaySessions = useMemo(() => {
    const merged = mergePtSchedules(
      ptTodayScheduleRes?.data ?? [],
      ptAssistRes?.data ?? [],
      ptTodayRange.from,
      ptTodayRange.to,
    ).filter((s) => s.extendedProps.status !== 'REJECTED');
    return merged.sort(
      (a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf(),
    );
  }, [
    ptTodayScheduleRes?.data,
    ptAssistRes?.data,
    ptTodayRange.from,
    ptTodayRange.to,
  ]);

  const displayName =
    profile?.name?.trim() || profile?.email?.split('@')[0] || 'Thành viên';

  const initials = useMemo(() => {
    const n = profile?.name?.trim();
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean);
      const s =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`
          : (parts[0]?.slice(0, 2) ?? '');
      return s.toUpperCase();
    }
    return profile?.email?.slice(0, 2).toUpperCase() ?? '?';
  }, [profile?.name, profile?.email]);

  const bmi =
    profile?.height != null && profile?.weight != null && profile.height > 0
      ? profile.weight / Math.pow(profile.height / 100, 2)
      : null;

  const hasBmi = bmi != null && Number.isFinite(bmi);

  if (!isLoggedIn && !authLoading) {
    return <Result status="warning" title="Vui lòng đăng nhập để xem hồ sơ" />;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Result
          status="error"
          title="Không tải được hồ sơ"
          subTitle="Vui lòng thử lại sau."
        />
      </div>
    );
  }

  const goalText = fitnessGoalLabel(profile.fitnessGoal);
  const showMemberSince = Boolean(profile.createdAt);

  const openEditModal = () => {
    if (!profile) return;
    editForm.setFieldsValue({
      name: profile.name ?? '',
      gender: profile.gender ?? undefined,
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : undefined,
      avatar: profile.avatar ?? '',
      height: profile.height ?? undefined,
      weight: profile.weight ?? undefined,
      fitnessGoal: profile.fitnessGoal ?? undefined,
    });
    setEditOpen(true);
  };

  const onSubmitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = cleanUpdatePayload(values);
      if (Object.keys(payload).length === 0) {
        message.warning('Chưa có thay đổi nào để lưu');
        return;
      }
      submitUpdate(payload);
    } catch {
      // validation error
    }
  };

  const openTodayProgramLearning = () => {
    const pid = todayProgramDay?.programId;
    const dayId = todayProgramDay?.id;
    if (!pid) return;
    router.push(
      dayId
        ? `${appRoute.home.programLearn(pid)}?dayId=${dayId}`
        : appRoute.home.programLearn(pid),
    );
  };

  const openCreateExerciseModal = () => {
    createExerciseForm.setFieldsValue({
      level: 'BEGINNER',
      muscleGroup: 'CHEST',
      isActive: true,
      suggestion: '',
    });
    setVideoPreviewUrl('');
    setVideoLoadOk(false);
    setVideoCheckTriggered(false);
    setCreateExerciseOpen(true);
  };

  const openCreateProgramModal = () => {
    createProgramForm.setFieldsValue({
      name: '',
      description: '',
      level: 'BEGINNER',
      daysPerWeek: 3,
      thumbnail: '',
    });
    setCreateProgramOpen(true);
  };

  const triggerVideoCheck = async () => {
    try {
      const values = await createExerciseForm.validateFields(['videoUrl']);
      setVideoCheckTriggered(true);
      setVideoLoadOk(false);
      setVideoPreviewUrl(values.videoUrl.trim());
    } catch {
      // validation
    }
  };

  const handleCreateExercise = async () => {
    try {
      const values = await createExerciseForm.validateFields();
      if (!videoCheckTriggered || !videoLoadOk) {
        message.warning('Vui lòng kiểm tra video hiển thị được trước khi tạo.');
        return;
      }
      submitCreateExercise({
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        content: values.content.trim(),
        equipments: values.equipments.trim(),
        thumbnail: values.thumbnail.trim(),
        videoUrl: values.videoUrl.trim(),
        suggestion: values.suggestion?.trim() || '',
      });
    } catch {
      // validation
    }
  };

  const handleCreateProgram = async () => {
    try {
      const values = await createProgramForm.validateFields();
      submitCreateProgram({
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        thumbnail: values.thumbnail.trim(),
      });
    } catch {
      // validation
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 pt-10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-800"
            >
              ← Quay lại
            </button>
            <h1 className="text-3xl font-bold text-neutral-900">
              Hồ sơ của tôi
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {user?.role !== 'USER' ? (
              <>
                <Button
                  icon={<PlusOutlined />}
                  onClick={openCreateExerciseModal}
                >
                  Tạo bài tập
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  onClick={openCreateProgramModal}
                >
                  Tạo chương trình
                </Button>
              </>
            ) : null}
            <Button
              type="primary"
              className="bg-black!"
              onClick={openEditModal}
            >
              Cập nhật hồ sơ
            </Button>
          </div>
        </div>

        <div className="grid auto-rows-auto grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BentoCard className="flex items-center gap-5 md:col-span-2">
            <Avatar
              size={80}
              src={profile.avatar || undefined}
              icon={!profile.avatar ? <UserOutlined /> : undefined}
              className="shrink-0 border-2 border-neutral-900"
            >
              {!profile.avatar ? initials : null}
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-neutral-900">
                {displayName}
              </h2>
              <p className="truncate text-sm text-neutral-500">
                {profile.email}
              </p>
              {showMemberSince ? (
                <div className="mt-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-medium text-neutral-800">
                    Thành viên từ{' '}
                    {dayjs(profile.createdAt).format('DD/MM/YYYY')}
                  </span>
                </div>
              ) : null}
            </div>
          </BentoCard>

          <BentoCard className="flex flex-col items-center justify-center text-center">
            <ThunderboltOutlined className="mb-2 text-3xl text-neutral-900" />
            <span className="text-3xl font-bold text-neutral-900">
              {user?.role === 'USER' ? ptAcceptedCount : 0}
            </span>
            <span className="text-xs text-neutral-500">
              Buổi tập với PT (đã xác nhận)
            </span>
            {user?.role !== 'USER' ? (
              <span className="mt-1 text-xs text-neutral-400">
                Đang cập nhật
              </span>
            ) : null}
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <CalendarOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                {isPt ? 'Tổng số ca dạy' : 'Check-in tại phòng'}
              </span>
            </div>
            {isPt ? (
              <>
                <p className="text-sm text-neutral-700">
                  Tổng{' '}
                  <span className="font-semibold text-neutral-900">
                    {ptTotalTeachingSessions}
                  </span>{' '}
                  ca trong năm {dayjs().year()}
                </p>
                <p className="mt-2 text-sm text-neutral-700">
                  Đã xác nhận:{' '}
                  <span className="font-semibold text-neutral-900">
                    {ptAcceptedTeachingCount}
                  </span>{' '}
                  ca
                </p>
                {ptTotalTeachingSessions === 0 ? (
                  <p className="mt-2 text-sm text-neutral-400">
                    Chưa có ca dạy nào trong năm nay.
                  </p>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-700">
                  Tổng{' '}
                  <span className="font-semibold text-neutral-900">
                    {totalCheckIns}
                  </span>{' '}
                  lượt
                </p>
                <p className="mt-2 text-sm text-neutral-700">
                  Chuỗi hiện tại:{' '}
                  <span className="font-semibold text-neutral-900">
                    {checkInStreak}
                  </span>{' '}
                  ngày liên tiếp có check-in
                </p>
                {totalCheckIns === 0 ? (
                  <p className="mt-2 text-sm text-neutral-400">Đang cập nhật</p>
                ) : null}
              </>
            )}
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <ThunderboltOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                {isPt ? 'Lịch dạy hôm nay' : 'Lịch tập hôm nay'}
              </span>
            </div>
            {isPt ? (
              ptTodaySessions.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  Hôm nay bạn chưa có ca dạy.
                </p>
              ) : (
                <div className="space-y-3">
                  {ptTodaySessions.map((session) => {
                    const trainee =
                      session.extendedProps.account.profile?.name ??
                      session.extendedProps.account.email;
                    return (
                      <div
                        key={session.id}
                        className="rounded-xl bg-neutral-50 p-3"
                      >
                        <p className="text-sm font-semibold text-neutral-900">
                          {trainee}
                        </p>
                        <p className="mt-1 text-xs text-neutral-600">
                          {dayjs(session.start).format('HH:mm')} —{' '}
                          {dayjs(session.end).format('HH:mm')} ·{' '}
                          {session.extendedProps.branch.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-neutral-500">
                          {ptScheduleStatusLabel(session.extendedProps.status)}
                        </p>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => router.push('/pt/schedule')}
                    className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                  >
                    Xem lịch dạy đầy đủ
                  </button>
                </div>
              )
            ) : !todayProgramDay || todayExercises.length === 0 ? (
              <p className="text-sm text-neutral-500">
                Hôm nay bạn chưa có bài tập.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-neutral-50 p-3">
                  <p className="text-sm font-semibold text-neutral-900">
                    {todayProgramDay.title}
                  </p>
                  {todayProgramDay.note ? (
                    <p className="mt-1 text-xs text-neutral-600">
                      {todayProgramDay.note}
                    </p>
                  ) : null}
                </div>
                {todayExercises.map((item) => (
                  <div key={item.id} className="rounded-xl bg-neutral-50 p-3">
                    <p className="text-sm font-medium text-neutral-900">
                      {item.sortOrder}. {item.exercise.name}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {item.exercise.muscleGroup} · {item.exercise.level}
                    </p>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={openTodayProgramLearning}
                  className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
                >
                  Bắt đầu học ngay
                </button>
              </div>
            )}
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <ColumnHeightOutlined className="text-lg text-neutral-800" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Chiều cao</p>
                <p className="text-xl font-bold text-neutral-900">
                  {renderUpdating(profile.height, (v) => (
                    <>
                      {v}{' '}
                      <span className="text-sm font-normal text-neutral-500">
                        cm
                      </span>
                    </>
                  ))}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <StockOutlined className="text-lg text-neutral-800" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Cân nặng</p>
                <p className="text-xl font-bold text-neutral-900">
                  {renderUpdating(profile.weight, (v) => (
                    <>
                      {v}{' '}
                      <span className="text-sm font-normal text-neutral-500">
                        kg
                      </span>
                    </>
                  ))}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <PieChartOutlined className="text-lg text-neutral-800" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">BMI</p>
                {hasBmi ? (
                  <>
                    <p className="text-xl font-bold text-neutral-900">
                      {bmi!.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-neutral-600">
                      {bmiLabel(bmi!)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-neutral-400">
                    Đang cập nhật
                  </p>
                )}
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <PhoneOutlined className="text-lg text-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500">Điện thoại</p>
                <p className="text-sm font-medium text-neutral-900">
                  {renderUpdating(profile.phone?.trim())}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <UserOutlined className="text-lg text-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500">Giới tính</p>
                <p className="text-sm font-medium text-neutral-900">
                  {renderUpdating(genderLabel(profile.gender))}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <CalendarOutlined className="text-lg text-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500">Ngày sinh</p>
                <p className="text-sm font-medium text-neutral-900">
                  {profile.dateOfBirth
                    ? dayjs(profile.dateOfBirth).format('DD/MM/YYYY')
                    : renderUpdating(null)}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <AimOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                Mục tiêu luyện tập
              </span>
            </div>
            <p className="text-sm text-neutral-700">
              {renderUpdating(goalText)}
            </p>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <ClockCircleOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                Buổi tập với PT gần đây
              </span>
            </div>
            {user?.role !== 'USER' ? (
              <p className="text-sm text-neutral-400">Đang cập nhật</p>
            ) : recentPt.length === 0 ? (
              <p className="text-sm text-neutral-400">Đang cập nhật</p>
            ) : (
              <div className="space-y-3">
                {recentPt.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-col gap-1 rounded-xl bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {w.userPackage.package.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {dayjs(w.startTime).format('DD/MM/YYYY HH:mm')} ·{' '}
                        {w.branch.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium capitalize text-neutral-600">
                      {w.status === 'ACCEPTED'
                        ? 'Đã xác nhận'
                        : w.status === 'REJECTED'
                          ? 'Từ chối'
                          : w.status === 'PENDING'
                            ? 'Chờ xác nhận'
                            : w.status === 'CANCELLED'
                              ? 'Đã hủy'
                              : w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>

          {user?.role !== 'USER' ? (
            <BentoCard className="md:col-span-2">
              <div className="mb-2 flex items-center gap-2">
                <PlusOutlined className="text-neutral-900" />
                <span className="text-sm font-semibold text-neutral-900">
                  Quản lý nội dung tập luyện
                </span>
              </div>
              <p className="text-sm text-neutral-700">
                Bạn có thể tạo mới bài tập và chương trình tập trực tiếp từ
                trang hồ sơ.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={openCreateExerciseModal}>Tạo bài tập</Button>
                <Button onClick={openCreateProgramModal}>
                  Tạo chương trình
                </Button>
              </div>
            </BentoCard>
          ) : null}
        </div>
      </div>

      <Modal
        title="Cập nhật thông tin hồ sơ"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={onSubmitEdit}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={isUpdating}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-3">
          <Form.Item
            name="name"
            label="Họ và tên"
            rules={profileFieldRules.name}
            validateTrigger={['onBlur', 'onChange']}
          >
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={profileFieldRules.phone}
            validateTrigger="onBlur"
          >
            <Input placeholder="09xxxxxxxx" />
          </Form.Item>

          <Form.Item
            name="dateOfBirth"
            label="Ngày sinh"
            rules={profileFieldRules.dateOfBirth}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(current) =>
                current != null && current > dayjs().endOf('day')
              }
            />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="Avatar URL"
            rules={profileFieldRules.avatar}
            validateTrigger="onBlur"
          >
            <Input placeholder="https://... hoặc /uploads/..." />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              name="height"
              label="Chiều cao (cm)"
              rules={profileFieldRules.height}
            >
              <InputNumber className="w-full" min={50} max={300} />
            </Form.Item>
            <Form.Item
              name="weight"
              label="Cân nặng (kg)"
              rules={profileFieldRules.weight}
            >
              <InputNumber className="w-full" min={20} max={500} />
            </Form.Item>
          </div>

          <Form.Item name="fitnessGoal" label="Mục tiêu">
            <Select
              allowClear
              options={[
                { value: 'LOSE_WEIGHT', label: 'Giảm cân' },
                { value: 'GAIN_MUSCLE', label: 'Tăng cơ' },
                { value: 'IMPROVE_HEALTH', label: 'Cải thiện sức khỏe' },
                { value: 'MAINTAIN_WEIGHT', label: 'Duy trì cân nặng' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo bài tập"
        open={createExerciseOpen}
        onOk={handleCreateExercise}
        onCancel={() => {
          setCreateExerciseOpen(false);
          setVideoPreviewUrl('');
          setVideoLoadOk(false);
          setVideoCheckTriggered(false);
          createExerciseForm.resetFields();
        }}
        confirmLoading={isCreatingExercise}
        okText="Tạo"
        cancelText="Hủy"
        width={760}
        destroyOnClose
      >
        <Form form={createExerciseForm} layout="vertical" className="mt-2">
          <Form.Item
            name="name"
            label="Tên bài tập"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả ngắn"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung hướng dẫn"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="muscleGroup"
              label="Nhóm cơ"
              rules={[{ required: true }]}
            >
              <Select options={exerciseMuscleGroupOptions} />
            </Form.Item>
            <Form.Item name="level" label="Cấp độ" rules={[{ required: true }]}>
              <Select options={levelOptions} />
            </Form.Item>
          </div>
          <Form.Item
            name="equipments"
            label="Dụng cụ"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="thumbnail"
            label="Thumbnail URL"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="videoUrl"
            label="Video URL"
            rules={[{ required: true }]}
          >
            <Input
              onChange={() => {
                setVideoLoadOk(false);
              }}
            />
          </Form.Item>
          <div className="mb-3 flex items-center gap-3">
            <Button onClick={triggerVideoCheck}>Kiểm tra video</Button>
            {videoCheckTriggered ? (
              videoLoadOk ? (
                <span className="text-xs text-green-600">
                  Video hiển thị tốt.
                </span>
              ) : (
                <span className="text-xs text-neutral-500">
                  Đang kiểm tra video...
                </span>
              )
            ) : (
              <span className="text-xs text-neutral-500">
                Cần kiểm tra video trước khi tạo.
              </span>
            )}
          </div>
          {videoPreviewUrl ? (
            <div className="mb-3 aspect-video w-full overflow-hidden rounded bg-neutral-900">
              <iframe
                src={videoPreviewUrl}
                title="Video preview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setVideoLoadOk(true)}
              />
            </div>
          ) : null}
          <Form.Item name="suggestion" label="Gợi ý">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" initialValue>
            <Select
              options={[
                { value: true, label: 'Bật' },
                { value: false, label: 'Tắt' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo chương trình tập"
        open={createProgramOpen}
        onOk={handleCreateProgram}
        onCancel={() => {
          setCreateProgramOpen(false);
          createProgramForm.resetFields();
        }}
        confirmLoading={isCreatingProgram}
        okText="Tạo"
        cancelText="Hủy"
        width={520}
        destroyOnClose
      >
        <Form form={createProgramForm} layout="vertical" className="mt-2">
          <Form.Item
            name="name"
            label="Tên chương trình"
            rules={[{ required: true, message: 'Nhập tên chương trình' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Nhập mô tả' }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="level"
            label="Cấp độ"
            rules={[{ required: true, message: 'Chọn cấp độ' }]}
          >
            <Select options={levelOptions} />
          </Form.Item>
          <Form.Item
            name="daysPerWeek"
            label="Số ngày tập/tuần"
            rules={[{ required: true, message: 'Nhập số ngày tập' }]}
          >
            <InputNumber min={1} max={7} className="w-full" />
          </Form.Item>
          <Form.Item
            name="thumbnail"
            label="URL ảnh đại diện"
            rules={[{ required: true, message: 'Nhập URL ảnh' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
