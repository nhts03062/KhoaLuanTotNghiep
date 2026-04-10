'use client';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import {
  createProgram,
  createProgramDay,
  createProgramDayExercise,
  getExercises,
  getPrograms,
} from '@/app/services/api';
import { useAuthStore } from '@/app/stores/authStore';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  CreateProgramDayExerciseRequest,
  CreateProgramDayRequest,
  Exercise,
  ExercisesResponse,
  Program,
  ProgramDay,
  ProgramDayExercise,
  ProgramRequest,
  ProgramsResponse,
} from '@/app/types/types';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';
import {
  DAY_OF_WEEK_SELECT_OPTIONS,
  formatDayOfWeekVietnamese,
} from '@/app/utils/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Collapse,
  Empty,
  Form,
  Image,
  Input,
  InputNumber,
  List,
  Modal,
  Pagination,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { AxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';

const { Search } = Input;
const { Text } = Typography;

function sortDayExercises(items: ProgramDayExercise[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

const PROGRAM_LEVEL_OPTIONS = (
  ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const
).map((value) => ({
  value,
  label: levelLabels[value],
}));

export default function PtProgramsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.userId;

  const [form] = Form.useForm<{
    dayOfWeek: number;
    title: string;
    note?: string;
  }>();

  const [exerciseForm] = Form.useForm<{
    exerciseId: string;
    sortOrder: number;
  }>();

  const [createProgramForm] = Form.useForm<ProgramRequest>();

  const [createProgramModalOpen, setCreateProgramModalOpen] = useState(false);

  const [createDayModalOpen, setCreateDayModalOpen] = useState(false);
  const [createDayProgramId, setCreateDayProgramId] = useState<string | null>(
    null,
  );

  const [addExerciseModalOpen, setAddExerciseModalOpen] = useState(false);
  const [addExerciseProgramId, setAddExerciseProgramId] = useState<
    string | null
  >(null);
  const [addExerciseDayId, setAddExerciseDayId] = useState<string | null>(null);
  const [excludeExerciseIds, setExcludeExerciseIds] = useState<string[]>([]);
  const [exercisePickerSearch, setExercisePickerSearch] = useState('');
  const [exerciseSearchInput, setExerciseSearchInput] = useState('');

  useEffect(() => {
    if (!addExerciseModalOpen) return;
    const t = window.setTimeout(() => {
      setExercisePickerSearch(exerciseSearchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [exerciseSearchInput, addExerciseModalOpen]);

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: undefined,
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const { data, isLoading } = useQuery<ProgramsResponse>({
    queryKey: ['pt-programs', filters],
    queryFn: () => getPrograms(filters),
  });

  const programs: Program[] = data?.data ?? [];

  const isOwn = (program: Program) =>
    Boolean(currentUserId && program.createdById === currentUserId);

  const isShared = (program: Program) => !program.createdById;

  const handleApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<{ message?: string }>;
    if (axiosErr?.response?.status === 403) {
      message.error('Bạn chỉ có thể thao tác trên chương trình do mình tạo.');
      return;
    }
    message.error(axiosErr?.response?.data?.message ?? fallback);
  };

  const exercisePickerFilter = useMemo<FILTER_PROPS>(
    () => ({
      page: 1,
      itemsPerPage: 200,
      search: exercisePickerSearch.trim() || undefined,
    }),
    [exercisePickerSearch],
  );

  const { data: exercisesPickerRes, isLoading: exercisesPickerLoading } =
    useQuery<ExercisesResponse>({
      queryKey: ['pt-exercises-picker', exercisePickerFilter],
      queryFn: () => getExercises(exercisePickerFilter),
      enabled: addExerciseModalOpen,
    });

  const exerciseOptions = useMemo(() => {
    const list: Exercise[] = exercisesPickerRes?.data ?? [];
    const excluded = new Set(excludeExerciseIds);
    return list
      .filter((ex) => !excluded.has(ex.id))
      .map((ex) => ({
        value: ex.id,
        label: ex.name,
      }));
  }, [exercisesPickerRes?.data, excludeExerciseIds]);

  const { mutate: submitProgram, isPending: isCreatingProgram } = useMutation({
    mutationFn: (payload: ProgramRequest) => createProgram(payload),
    onSuccess: () => {
      message.success('Đã tạo chương trình');
      queryClient.invalidateQueries({ queryKey: ['pt-programs'] });
      setCreateProgramModalOpen(false);
      createProgramForm.resetFields();
    },
    onError: (err) => handleApiError(err, 'Không thể tạo chương trình.'),
  });

  const openCreateProgramModal = () => {
    createProgramForm.setFieldsValue({
      name: '',
      description: '',
      level: 'BEGINNER',
      daysPerWeek: 3,
      thumbnail: '',
    });
    setCreateProgramModalOpen(true);
  };

  const handleCreateProgramModalOk = async () => {
    try {
      const values = await createProgramForm.validateFields();
      submitProgram({
        name: values.name.trim(),
        description: values.description.trim(),
        level: values.level,
        daysPerWeek: values.daysPerWeek,
        thumbnail: values.thumbnail.trim(),
      });
    } catch {
      // validation failed
    }
  };

  const handleCreateProgramModalCancel = () => {
    setCreateProgramModalOpen(false);
    createProgramForm.resetFields();
  };

  const { mutate: submitProgramDay, isPending: isCreatingDay } = useMutation({
    mutationFn: (payload: CreateProgramDayRequest) => createProgramDay(payload),
    onSuccess: () => {
      message.success('Đã thêm ngày tập');
      queryClient.invalidateQueries({ queryKey: ['pt-programs'] });
      setCreateDayModalOpen(false);
      setCreateDayProgramId(null);
      form.resetFields();
    },
    onError: (err) => handleApiError(err, 'Không thể tạo ngày tập.'),
  });

  const openCreateDayModal = (programId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCreateDayProgramId(programId);
    form.setFieldsValue({
      dayOfWeek: 1,
      title: '',
      note: '',
    });
    setCreateDayModalOpen(true);
  };

  const handleCreateDayModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (!createDayProgramId) return;
      submitProgramDay({
        programId: createDayProgramId,
        dayOfWeek: values.dayOfWeek,
        title: values.title.trim(),
        note: values.note?.trim() ?? '',
      });
    } catch {
      // validation failed
    }
  };

  const handleCreateDayModalCancel = () => {
    setCreateDayModalOpen(false);
    setCreateDayProgramId(null);
    form.resetFields();
  };

  const { mutate: submitProgramDayExercise, isPending: isAddingExercise } =
    useMutation({
      mutationFn: (payload: CreateProgramDayExerciseRequest) =>
        createProgramDayExercise(payload),
      onSuccess: () => {
        message.success('Đã thêm bài tập vào ngày');
        queryClient.invalidateQueries({ queryKey: ['pt-programs'] });
        setAddExerciseModalOpen(false);
        setAddExerciseProgramId(null);
        setAddExerciseDayId(null);
        setExcludeExerciseIds([]);
        setExerciseSearchInput('');
        setExercisePickerSearch('');
        exerciseForm.resetFields();
      },
      onError: (err) => handleApiError(err, 'Không thể thêm bài tập.'),
    });

  const openAddExerciseModal = (
    programId: string,
    day: ProgramDay,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    const maxOrder =
      day.exercises?.length > 0
        ? Math.max(...day.exercises.map((x) => x.sortOrder))
        : 0;
    setAddExerciseProgramId(programId);
    setAddExerciseDayId(day.id);
    setExcludeExerciseIds(
      (day.exercises ?? []).map((row) => row.exerciseId),
    );
    setExerciseSearchInput('');
    setExercisePickerSearch('');
    exerciseForm.setFieldsValue({
      exerciseId: undefined,
      sortOrder: maxOrder + 1,
    });
    setAddExerciseModalOpen(true);
  };

  const handleAddExerciseModalOk = async () => {
    try {
      const values = await exerciseForm.validateFields();
      if (!addExerciseProgramId || !addExerciseDayId) return;
      submitProgramDayExercise({
        programId: addExerciseProgramId,
        dayId: addExerciseDayId,
        exerciseId: values.exerciseId,
        sortOrder: values.sortOrder,
      });
    } catch {
      // validation failed
    }
  };

  const handleAddExerciseModalCancel = () => {
    setAddExerciseModalOpen(false);
    setAddExerciseProgramId(null);
    setAddExerciseDayId(null);
    setExcludeExerciseIds([]);
    setExerciseSearchInput('');
    setExercisePickerSearch('');
    exerciseForm.resetFields();
  };

  return (
    <div className="min-h-screen bg-background pb-16 pt-10">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="mb-6">
          <Typography.Title level={3} className="mb-1!">
            Chương trình của tôi
          </Typography.Title>
          <Text type="secondary">
            Quản lý chương trình tập do bạn tạo. Chương trình từ hệ thống sẽ
            hiển thị ở chế độ chỉ xem.
          </Text>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded bg-gray-50 p-4">
          <Search
            allowClear
            placeholder="Tìm theo tên hoặc mô tả chương trình..."
            className="min-w-[200px] max-w-md flex-1"
            onChange={handleSearch}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateProgramModal}
          >
            Tạo chương trình
          </Button>
        </div>

        <div className="rounded bg-gray-50 p-4">
          {isLoading ? (
            <SkeletonLoading />
          ) : programs.length === 0 ? (
            <Empty description="Chưa có chương trình tập nào" />
          ) : (
            <>
              <Collapse
                bordered={false}
                className="bg-transparent"
                items={programs.map((program) => {
                  const own = isOwn(program);
                  const shared = isShared(program);
                  return {
                    key: program.id,
                    label: (
                      <div className="flex flex-wrap items-center gap-3 py-1">
                        <Image
                          src={program.thumbnail || '/globe.svg'}
                          alt=""
                          width={56}
                          height={42}
                          className="rounded object-cover"
                          fallback="/globe.svg"
                          preview={false}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-neutral-900">
                            {program.name}
                          </div>
                          <Text type="secondary" className="line-clamp-1 text-sm">
                            {program.description}
                          </Text>
                        </div>
                        <Space wrap size="small">
                          {shared ? (
                            <Tag>Hệ thống</Tag>
                          ) : own ? (
                            <Tag color="green">Của tôi</Tag>
                          ) : (
                            <Tag>Khác</Tag>
                          )}
                          <Tag color="blue">
                            {levelLabels[program.level] ?? program.level}
                          </Tag>
                          <Tag>{program.daysPerWeek} ngày/tuần</Tag>
                          <Tag color={program.isActive ? 'green' : 'default'}>
                            {program.isActive ? 'Đang bật' : 'Tắt'}
                          </Tag>
                          {own ? (
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={(e) => openCreateDayModal(program.id, e)}
                            >
                              Thêm ngày tập
                            </Button>
                          ) : (
                            <Tag color="default">Chỉ xem</Tag>
                          )}
                        </Space>
                      </div>
                    ),
                    children: !program.days?.length ? (
                      <Empty
                        className="my-2"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có ngày tập"
                      />
                    ) : (
                      <Collapse
                        size="small"
                        bordered={false}
                        className="bg-neutral-50"
                        items={[...program.days]
                          .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                          .map((day) => ({
                            key: day.id,
                            label: (
                              <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1 pr-1">
                                <span>
                                  <span className="font-medium">{day.title}</span>
                                  <Text type="secondary" className="ml-2 text-sm">
                                    · {formatDayOfWeekVietnamese(day.dayOfWeek)}
                                  </Text>
                                </span>
                                {own ? (
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={(e) =>
                                      openAddExerciseModal(program.id, day, e)
                                    }
                                  >
                                    Thêm bài tập
                                  </Button>
                                ) : null}
                              </div>
                            ),
                            children: (
                              <div className="pl-1">
                                {day.note ? (
                                  <p className="mb-3 text-sm text-neutral-600">
                                    {day.note}
                                  </p>
                                ) : null}
                                {!day.exercises?.length ? (
                                  <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description="Chưa gán bài tập"
                                  />
                                ) : (
                                  <List
                                    size="small"
                                    bordered
                                    dataSource={sortDayExercises(day.exercises)}
                                    renderItem={(row) => (
                                      <List.Item>
                                        <List.Item.Meta
                                          title={
                                            <span>
                                              <Tag className="mr-2">
                                                #{row.sortOrder}
                                              </Tag>
                                              {row.exercise.name}
                                            </span>
                                          }
                                          description={
                                            <Space wrap size={[0, 4]}>
                                              <Text
                                                type="secondary"
                                                className="text-xs"
                                              >
                                                {muscleGroupLabels[
                                                  row.exercise.muscleGroup
                                                ] ?? row.exercise.muscleGroup}
                                              </Text>
                                              <span className="text-xs text-neutral-400">
                                                ·
                                              </span>
                                              <Text
                                                type="secondary"
                                                className="text-xs"
                                              >
                                                {levelLabels[row.exercise.level] ??
                                                  row.exercise.level}
                                              </Text>
                                              {row.exercise.equipments ? (
                                                <>
                                                  <span className="text-xs text-neutral-400">
                                                    ·
                                                  </span>
                                                  <Text
                                                    type="secondary"
                                                    className="text-xs"
                                                  >
                                                    {row.exercise.equipments}
                                                  </Text>
                                                </>
                                              ) : null}
                                            </Space>
                                          }
                                        />
                                      </List.Item>
                                    )}
                                  />
                                )}
                              </div>
                            ),
                          }))}
                      />
                    ),
                  };
                })}
              />

              <div className="mt-6 flex justify-end">
                <Pagination
                  current={filters.page}
                  pageSize={filters.itemsPerPage}
                  total={data?.meta.total}
                  showSizeChanger
                  onChange={(page, pageSize) =>
                    setFilters((prev) => ({
                      ...prev,
                      page,
                      itemsPerPage: pageSize,
                    }))
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title="Tạo chương trình tập"
        open={createProgramModalOpen}
        onOk={handleCreateProgramModalOk}
        onCancel={handleCreateProgramModalCancel}
        confirmLoading={isCreatingProgram}
        okText="Tạo"
        cancelText="Hủy"
        destroyOnClose
        width={520}
      >
        <Form form={createProgramForm} layout="vertical" className="mt-2">
          <Form.Item
            name="name"
            label="Tên chương trình"
            rules={[{ required: true, message: 'Nhập tên chương trình' }]}
          >
            <Input placeholder="Ví dụ: Tăng cơ toàn thân 8 tuần" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Nhập mô tả' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả ngắn về chương trình"
            />
          </Form.Item>
          <Form.Item
            name="level"
            label="Cấp độ"
            rules={[{ required: true, message: 'Chọn cấp độ' }]}
          >
            <Select
              placeholder="Chọn cấp độ"
              options={PROGRAM_LEVEL_OPTIONS}
            />
          </Form.Item>
          <Form.Item
            name="daysPerWeek"
            label="Số ngày tập / tuần"
            rules={[
              { required: true, message: 'Nhập số ngày' },
              {
                type: 'number',
                min: 1,
                max: 7,
                message: 'Từ 1 đến 7 ngày',
              },
            ]}
          >
            <InputNumber min={1} max={7} className="w-full" />
          </Form.Item>
          <Form.Item
            name="thumbnail"
            label="URL ảnh đại diện"
            rules={[{ required: true, message: 'Nhập URL ảnh' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thêm ngày trong chương trình"
        open={createDayModalOpen}
        onOk={handleCreateDayModalOk}
        onCancel={handleCreateDayModalCancel}
        confirmLoading={isCreatingDay}
        okText="Tạo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" className="mt-2">
          <Form.Item
            name="dayOfWeek"
            label="Thứ trong tuần"
            rules={[{ required: true, message: 'Chọn thứ trong tuần' }]}
          >
            <Select
              placeholder="Chọn từ Thứ 2 đến Chủ nhật"
              options={DAY_OF_WEEK_SELECT_OPTIONS}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item
            name="title"
            label="Tiêu đề ngày"
            rules={[{ required: true, message: 'Nhập tiêu đề' }]}
          >
            <Input placeholder="Ví dụ: Ngày đẩy ngực" />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea
              rows={3}
              placeholder="Ghi chú cho ngày tập (tùy chọn)"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thêm bài tập vào ngày"
        open={addExerciseModalOpen}
        onOk={handleAddExerciseModalOk}
        onCancel={handleAddExerciseModalCancel}
        confirmLoading={isAddingExercise}
        okText="Thêm"
        cancelText="Hủy"
        destroyOnClose
        width={480}
      >
        <div className="mb-3 mt-2">
          <Input.Search
            allowClear
            placeholder="Tìm bài tập..."
            value={exerciseSearchInput}
            onChange={(e) => setExerciseSearchInput(e.target.value)}
            onSearch={(v) => setExercisePickerSearch(v.trim())}
          />
        </div>
        <Form form={exerciseForm} layout="vertical">
          <Form.Item
            name="exerciseId"
            label="Bài tập"
            rules={[{ required: true, message: 'Chọn bài tập' }]}
          >
            <Select
              showSearch
              placeholder="Chọn bài tập"
              loading={exercisesPickerLoading}
              options={exerciseOptions}
              optionFilterProp="label"
              notFoundContent={
                exercisesPickerLoading ? undefined : 'Không có bài tập phù hợp'
              }
            />
          </Form.Item>
          <Form.Item
            name="sortOrder"
            label="Thứ tự (sortOrder)"
            rules={[
              { required: true, message: 'Nhập thứ tự' },
              {
                type: 'number',
                min: 1,
                message: 'Thứ tự tối thiểu là 1',
              },
            ]}
          >
            <InputNumber min={1} className="w-full" placeholder="1, 2, 3…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
