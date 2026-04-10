'use client';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import {
  createExercise,
  deleteExercise,
  getExerciseById,
  getExercises,
  updateExercise,
} from '@/app/services/api';
import { useAuthStore } from '@/app/stores/authStore';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  CreateExerciseRequest,
  Exercise,
  ExerciseDetailResponse,
  ExercisesResponse,
  UpdateExerciseRequest,
} from '@/app/types/types';
import { formatDate } from '@/app/utils/common';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  TableProps,
  Tag,
  Typography,
  message,
} from 'antd';
import { AxiosError } from 'axios';
import { useMemo, useState } from 'react';

const { Search } = Input;
const { Text } = Typography;

const muscleGroupOptions: {
  value: CreateExerciseRequest['muscleGroup'];
  label: string;
}[] = [
  { value: 'CHEST', label: 'Ngực' },
  { value: 'BACK', label: 'Lưng' },
  { value: 'ARMS', label: 'Tay' },
  { value: 'LEGS', label: 'Chân' },
  { value: 'ABS', label: 'Bụng' },
  { value: ' SHOULDERS', label: 'Vai' },
  { value: 'FULL_BODY', label: 'Toàn thân' },
];

const levelOptions = [
  { value: 'BEGINNER', label: levelLabels.BEGINNER },
  { value: 'INTERMEDIATE', label: levelLabels.INTERMEDIATE },
  { value: 'ADVANCED', label: levelLabels.ADVANCED },
];

type ExerciseFormValues = CreateExerciseRequest;

export default function PtExercisesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentUserId = user?.userId;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<ExerciseFormValues>();
  const [createVideoPreviewUrl, setCreateVideoPreviewUrl] = useState('');
  const [createVideoLoadOk, setCreateVideoLoadOk] = useState(false);
  const [createVideoCheckTriggered, setCreateVideoCheckTriggered] =
    useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm] = Form.useForm<ExerciseFormValues>();
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editVideoPreviewUrl, setEditVideoPreviewUrl] = useState('');
  const [editVideoLoadOk, setEditVideoLoadOk] = useState(false);
  const [editVideoCheckTriggered, setEditVideoCheckTriggered] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null,
  );

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: undefined,
  });
  const [showInactive, setShowInactive] = useState(false);
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  const { data, isLoading } = useQuery<ExercisesResponse>({
    queryKey: ['pt-exercises', filters.search],
    queryFn: () =>
      getExercises({
        page: 1,
        itemsPerPage: 500,
        search: filters.search,
      }),
  });

  const exercises: Exercise[] = data?.data ?? [];

  const filteredExercises = useMemo(() => {
    let list = exercises;
    if (!showInactive) {
      list = list.filter((ex) => ex.isActive);
    }
    if (showOnlyMine && currentUserId) {
      list = list.filter((ex) => ex.createdById === currentUserId);
    }
    return list;
  }, [exercises, showInactive, showOnlyMine, currentUserId]);

  const paginatedExercises = useMemo(() => {
    const start = ((filters.page ?? 1) - 1) * (filters.itemsPerPage ?? 10);
    return filteredExercises.slice(start, start + (filters.itemsPerPage ?? 10));
  }, [filteredExercises, filters.page, filters.itemsPerPage]);

  const {
    data: detailRes,
    isLoading: detailLoading,
    isError: detailError,
  } = useQuery<ExerciseDetailResponse>({
    queryKey: ['pt-exercise-detail', selectedExerciseId],
    queryFn: () => getExerciseById(selectedExerciseId!),
    enabled: Boolean(drawerOpen && selectedExerciseId),
    retry: 1,
  });

  const detail = detailRes?.data;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const handleTableChange: TableProps<Exercise>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage,
    }));
  };

  const isOwn = (record: Exercise) =>
    Boolean(currentUserId && record.createdById === currentUserId);

  const isShared = (record: Exercise) => !record.createdById;

  const handleApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<{ message?: string }>;
    if (axiosErr?.response?.status === 403) {
      message.error('Bạn chỉ có thể thao tác trên bài tập do mình tạo.');
      return;
    }
    message.error(axiosErr?.response?.data?.message ?? fallback);
  };

  const { mutate: submitCreateExercise, isPending: isCreatingExercise } =
    useMutation({
      mutationFn: (payload: CreateExerciseRequest) => createExercise(payload),
      onSuccess: () => {
        message.success('Đã tạo bài tập');
        queryClient.invalidateQueries({ queryKey: ['pt-exercises'] });
        closeCreateModal();
      },
      onError: (err) => handleApiError(err, 'Không thể tạo bài tập.'),
    });

  const { mutate: submitUpdateExercise, isPending: isUpdatingExercise } =
    useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: UpdateExerciseRequest;
      }) => updateExercise(id, payload),
      onSuccess: () => {
        message.success('Đã cập nhật bài tập');
        queryClient.invalidateQueries({ queryKey: ['pt-exercises'] });
        queryClient.invalidateQueries({ queryKey: ['pt-exercise-detail'] });
        closeEditModal();
      },
      onError: (err) => handleApiError(err, 'Không thể cập nhật bài tập.'),
    });

  const { mutate: submitDeleteExercise } = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      message.success('Đã xóa bài tập');
      queryClient.invalidateQueries({ queryKey: ['pt-exercises'] });
    },
    onError: (err) => handleApiError(err, 'Không thể xóa bài tập.'),
  });

  const openDetail = (record: Exercise) => {
    setSelectedExerciseId(record.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedExerciseId(null);
  };

  const openCreateModal = () => {
    createForm.setFieldsValue({
      level: 'BEGINNER',
      muscleGroup: 'CHEST',
      isActive: true,
      suggestion: '',
    } as ExerciseFormValues);
    setCreateVideoPreviewUrl('');
    setCreateVideoLoadOk(false);
    setCreateVideoCheckTriggered(false);
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
    setCreateVideoPreviewUrl('');
    setCreateVideoLoadOk(false);
    setCreateVideoCheckTriggered(false);
    createForm.resetFields();
  };

  const triggerCreateVideoCheck = async () => {
    try {
      const url = await createForm.validateFields(['videoUrl']);
      const nextUrl = url.videoUrl.trim();
      setCreateVideoCheckTriggered(true);
      setCreateVideoLoadOk(false);
      setCreateVideoPreviewUrl(nextUrl);
    } catch {
      // validation failed
    }
  };

  const handleCreateExercise = async () => {
    try {
      const values = await createForm.validateFields();
      if (!createVideoCheckTriggered || !createVideoLoadOk) {
        message.warning(
          'Vui lòng kiểm tra URL video hiển thị được trước khi tạo.',
        );
        return;
      }
      submitCreateExercise({
        name: values.name.trim(),
        description: values.description.trim(),
        content: values.content.trim(),
        muscleGroup: values.muscleGroup,
        level: values.level,
        equipments: values.equipments.trim(),
        thumbnail: values.thumbnail.trim(),
        videoUrl: values.videoUrl.trim(),
        suggestion: values.suggestion?.trim() || undefined,
        isActive: values.isActive ?? true,
      });
    } catch {
      // validation failed
    }
  };

  const openEditModal = (record: Exercise) => {
    setEditingExercise(record);
    editForm.setFieldsValue({
      name: record.name,
      description: record.description,
      content: record.content,
      muscleGroup: record.muscleGroup as CreateExerciseRequest['muscleGroup'],
      level: record.level,
      equipments: record.equipments,
      thumbnail: record.thumbnail,
      videoUrl: record.videoUrl,
      suggestion: record.suggestion ?? '',
      isActive: record.isActive,
    });
    setEditVideoPreviewUrl(record.videoUrl);
    setEditVideoLoadOk(true);
    setEditVideoCheckTriggered(true);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingExercise(null);
    setEditVideoPreviewUrl('');
    setEditVideoLoadOk(false);
    setEditVideoCheckTriggered(false);
    editForm.resetFields();
  };

  const triggerEditVideoCheck = async () => {
    try {
      const url = await editForm.validateFields(['videoUrl']);
      const nextUrl = url.videoUrl.trim();
      setEditVideoCheckTriggered(true);
      setEditVideoLoadOk(false);
      setEditVideoPreviewUrl(nextUrl);
    } catch {
      // validation failed
    }
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise) return;
    try {
      const values = await editForm.validateFields();
      if (!editVideoCheckTriggered || !editVideoLoadOk) {
        message.warning(
          'Vui lòng kiểm tra URL video hiển thị được trước khi lưu.',
        );
        return;
      }
      submitUpdateExercise({
        id: editingExercise.id,
        payload: {
          name: values.name.trim(),
          description: values.description.trim(),
          content: values.content.trim(),
          muscleGroup: values.muscleGroup,
          level: values.level,
          equipments: values.equipments.trim(),
          thumbnail: values.thumbnail.trim(),
          videoUrl: values.videoUrl.trim(),
          suggestion: values.suggestion?.trim() || undefined,
          isActive: values.isActive ?? true,
        },
      });
    } catch {
      // validation failed
    }
  };

  const handleDeleteExercise = (record: Exercise) => {
    Modal.confirm({
      title: 'Xóa bài tập',
      icon: <ExclamationCircleOutlined />,
      content: (
        <span>
          Bạn có chắc muốn xóa bài tập <Text strong>{record.name}</Text>? Hành
          động này không thể hoàn tác.
        </span>
      ),
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => submitDeleteExercise(record.id),
    });
  };

  const columns: TableProps<Exercise>['columns'] = [
    {
      title: 'Thumbnail',
      key: 'thumbnail',
      width: 88,
      render: (_: unknown, record: Exercise) => (
        <Image
          src={record.thumbnail || '/globe.svg'}
          alt={record.name}
          width={64}
          height={48}
          className="rounded object-cover"
          fallback="/globe.svg"
          preview={false}
        />
      ),
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: Exercise) => (
        <Button
          type="link"
          className="h-auto max-w-full whitespace-normal p-0 text-left"
          onClick={() => openDetail(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Nguồn',
      key: 'source',
      width: 120,
      render: (_: unknown, record: Exercise) =>
        isShared(record) ? (
          <Tag color="default">Hệ thống</Tag>
        ) : isOwn(record) ? (
          <Tag color="green">Của tôi</Tag>
        ) : (
          <Tag>Khác</Tag>
        ),
    },
    {
      title: 'Nhóm cơ',
      dataIndex: 'muscleGroup',
      key: 'muscleGroup',
      render: (v: Exercise['muscleGroup']) => muscleGroupLabels[v] ?? v,
    },
    {
      title: 'Cấp độ',
      dataIndex: 'level',
      key: 'level',
      render: (v: Exercise['level']) => levelLabels[v] ?? v,
    },
    {
      title: 'Dụng cụ',
      dataIndex: 'equipments',
      key: 'equipments',
      ellipsis: true,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) =>
        active ? <Tag color="green">Có</Tag> : <Tag>Không</Tag>,
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_: unknown, record: Exercise) =>
        isOwn(record) ? (
          <Space>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditModal(record)}
            >
              Sửa
            </Button>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteExercise(record)}
            >
              Xóa
            </Button>
          </Space>
        ) : (
          <Tag>Chỉ xem</Tag>
        ),
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-16 pt-10">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="mb-6">
          <Typography.Title level={3} className="mb-1!">
            Bài tập của tôi
          </Typography.Title>
          <Text type="secondary">
            Quản lý bài tập do bạn tạo. Bài tập từ hệ thống sẽ hiển thị ở chế độ
            chỉ xem.
          </Text>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-4 rounded bg-gray-50 p-4">
          <Search
            allowClear
            placeholder="Tìm theo tên hoặc mô tả..."
            className="max-w-md flex-1"
            onChange={handleSearch}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={showOnlyMine}
              onChange={(checked) => {
                setShowOnlyMine(checked);
                setFilters((prev) => ({ ...prev, page: 1 }));
              }}
              size="small"
            />
            <Text type="secondary">Chỉ bài tập của tôi</Text>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            Thêm bài tập
          </Button>
        </div>

        <div className="rounded bg-gray-50 p-4">
          {isLoading ? (
            <SkeletonLoading />
          ) : (
            <Table<Exercise>
              columns={columns}
              dataSource={paginatedExercises}
              rowKey="id"
              scroll={{ x: 1200 }}
              pagination={{
                current: filters.page,
                pageSize: filters.itemsPerPage,
                total: filteredExercises.length,
                showSizeChanger: true,
              }}
              onChange={handleTableChange}
            />
          )}
        </div>
      </div>

      <Drawer
        title={detail?.name ?? 'Chi tiết bài tập'}
        placement="right"
        width={560}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
      >
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : detailError ? (
          <p className="text-red-500">Không tải được chi tiết bài tập.</p>
        ) : detail ? (
          <div className="space-y-4">
            {detail.thumbnail ? (
              <Image
                src={detail.thumbnail}
                alt={detail.name}
                className="max-h-48 w-full rounded object-cover"
                fallback="/globe.svg"
              />
            ) : null}
            {detail.videoUrl?.trim() ? (
              <div className="aspect-video w-full overflow-hidden rounded bg-neutral-900">
                <iframe
                  src={detail.videoUrl}
                  title={detail.name}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Nguồn">
                {!detail.createdById ? (
                  <Tag>Hệ thống</Tag>
                ) : detail.createdById === currentUserId ? (
                  <Tag color="green">Của tôi</Tag>
                ) : (
                  <Tag>Khác</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tên">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                <Typography.Paragraph className="mb-0">
                  {detail.description}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung">
                <Typography.Paragraph className="mb-0 whitespace-pre-wrap">
                  {detail.content || '—'}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Nhóm cơ">
                {muscleGroupLabels[detail.muscleGroup] ?? detail.muscleGroup}
              </Descriptions.Item>
              <Descriptions.Item label="Cấp độ">
                {levelLabels[detail.level] ?? detail.level}
              </Descriptions.Item>
              <Descriptions.Item label="Dụng cụ">
                {detail.equipments || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Gợi ý">
                {detail.suggestion || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                {detail.isActive ? (
                  <Tag color="green">Có</Tag>
                ) : (
                  <Tag>Không</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatDate(detail.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật">
                {formatDate(detail.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <p className="text-neutral-500">Không tải được dữ liệu.</p>
        )}
      </Drawer>

      <Modal
        title="Tạo bài tập"
        open={createModalOpen}
        onOk={handleCreateExercise}
        onCancel={closeCreateModal}
        confirmLoading={isCreatingExercise}
        okText="Tạo"
        cancelText="Hủy"
        width={760}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" className="mt-3">
          <Form.Item
            name="name"
            label="Tên bài tập"
            rules={[{ required: true, message: 'Nhập tên bài tập' }]}
          >
            <Input placeholder="Ví dụ: Push-up" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả ngắn"
            rules={[{ required: true, message: 'Nhập mô tả' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung hướng dẫn"
            rules={[{ required: true, message: 'Nhập nội dung hướng dẫn' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="muscleGroup"
              label="Nhóm cơ"
              rules={[{ required: true, message: 'Chọn nhóm cơ' }]}
            >
              <Select options={muscleGroupOptions} />
            </Form.Item>
            <Form.Item
              name="level"
              label="Cấp độ"
              rules={[{ required: true, message: 'Chọn cấp độ' }]}
            >
              <Select options={levelOptions} />
            </Form.Item>
          </div>
          <Form.Item
            name="equipments"
            label="Dụng cụ"
            rules={[{ required: true, message: 'Nhập dụng cụ' }]}
          >
            <Input placeholder="Ví dụ: Thảm, tạ đơn..." />
          </Form.Item>
          <Form.Item
            name="thumbnail"
            label="Thumbnail URL"
            rules={[{ required: true, message: 'Nhập thumbnail URL' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            name="videoUrl"
            label="Video URL"
            rules={[{ required: true, message: 'Nhập video URL' }]}
          >
            <Input
              placeholder="https://..."
              onChange={() => {
                setCreateVideoLoadOk(false);
              }}
            />
          </Form.Item>
          <div className="mb-3 flex items-center gap-3">
            <Button onClick={triggerCreateVideoCheck}>Kiểm tra video</Button>
            {createVideoCheckTriggered ? (
              createVideoLoadOk ? (
                <Text type="success">Video hiển thị tốt, bạn có thể tạo.</Text>
              ) : (
                <Text type="secondary">Đang kiểm tra hiển thị video...</Text>
              )
            ) : (
              <Text type="secondary">
                Cần kiểm tra video trước khi tạo bài tập.
              </Text>
            )}
          </div>
          {createVideoPreviewUrl ? (
            <div className="mb-4 aspect-video w-full overflow-hidden rounded bg-neutral-900">
              <iframe
                src={createVideoPreviewUrl}
                title="Video preview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setCreateVideoLoadOk(true)}
              />
            </div>
          ) : null}
          <Form.Item name="suggestion" label="Gợi ý">
            <Input placeholder="Ví dụ: 3 hiệp x 12 lần (tùy chọn)" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Sửa bài tập"
        open={editModalOpen}
        onOk={handleUpdateExercise}
        onCancel={closeEditModal}
        confirmLoading={isUpdatingExercise}
        okText="Lưu"
        cancelText="Hủy"
        width={760}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-3">
          <Form.Item
            name="name"
            label="Tên bài tập"
            rules={[{ required: true, message: 'Nhập tên bài tập' }]}
          >
            <Input placeholder="Ví dụ: Push-up" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả ngắn"
            rules={[{ required: true, message: 'Nhập mô tả' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="content"
            label="Nội dung hướng dẫn"
            rules={[{ required: true, message: 'Nhập nội dung hướng dẫn' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item
              name="muscleGroup"
              label="Nhóm cơ"
              rules={[{ required: true, message: 'Chọn nhóm cơ' }]}
            >
              <Select options={muscleGroupOptions} />
            </Form.Item>
            <Form.Item
              name="level"
              label="Cấp độ"
              rules={[{ required: true, message: 'Chọn cấp độ' }]}
            >
              <Select options={levelOptions} />
            </Form.Item>
          </div>
          <Form.Item
            name="equipments"
            label="Dụng cụ"
            rules={[{ required: true, message: 'Nhập dụng cụ' }]}
          >
            <Input placeholder="Ví dụ: Thảm, tạ đơn..." />
          </Form.Item>
          <Form.Item
            name="thumbnail"
            label="Thumbnail URL"
            rules={[{ required: true, message: 'Nhập thumbnail URL' }]}
          >
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item
            name="videoUrl"
            label="Video URL"
            rules={[{ required: true, message: 'Nhập video URL' }]}
          >
            <Input
              placeholder="https://..."
              onChange={() => {
                setEditVideoLoadOk(false);
              }}
            />
          </Form.Item>
          <div className="mb-3 flex items-center gap-3">
            <Button onClick={triggerEditVideoCheck}>Kiểm tra video</Button>
            {editVideoCheckTriggered ? (
              editVideoLoadOk ? (
                <Text type="success">Video hiển thị tốt, bạn có thể lưu.</Text>
              ) : (
                <Text type="secondary">Đang kiểm tra hiển thị video...</Text>
              )
            ) : (
              <Text type="secondary">Cần kiểm tra video trước khi lưu.</Text>
            )}
          </div>
          {editVideoPreviewUrl ? (
            <div className="mb-4 aspect-video w-full overflow-hidden rounded bg-neutral-900">
              <iframe
                key={editVideoPreviewUrl}
                src={editVideoPreviewUrl}
                title="Video preview"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setEditVideoLoadOk(true)}
              />
            </div>
          ) : null}
          <Form.Item name="suggestion" label="Gợi ý">
            <Input placeholder="Ví dụ: 3 hiệp x 12 lần (tùy chọn)" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
