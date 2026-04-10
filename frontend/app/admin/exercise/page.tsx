'use client';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { createExercise, getExerciseById, getExercises } from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  CreateExerciseRequest,
  Exercise,
  ExerciseDetailResponse,
  ExercisesResponse,
} from '@/app/types/types';
import { formatDate } from '@/app/utils/common';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
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
import { useState } from 'react';

const { Search } = Input;
const { Text } = Typography;

const createMuscleGroupOptions: {
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

const createLevelOptions = [
  { value: 'BEGINNER', label: levelLabels.BEGINNER },
  { value: 'INTERMEDIATE', label: levelLabels.INTERMEDIATE },
  { value: 'ADVANCED', label: levelLabels.ADVANCED },
];

export default function AdminExercisePage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreateExerciseRequest>();
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');
  const [videoLoadOk, setVideoLoadOk] = useState(false);
  const [videoCheckTriggered, setVideoCheckTriggered] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null,
  );

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: undefined,
  });

  const { data: detailRes, isLoading: detailLoading, isError: detailError } =
    useQuery<ExerciseDetailResponse>({
      queryKey: ['exercise-detail', selectedExerciseId],
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

  const { data, isLoading } = useQuery<ExercisesResponse>({
    queryKey: ['admin-exercises', filters],
    queryFn: () => getExercises(filters),
  });

  const exercises: Exercise[] = data?.data ?? [];

  const { mutate: submitCreateExercise, isPending: isCreatingExercise } =
    useMutation({
      mutationFn: (payload: CreateExerciseRequest) => createExercise(payload),
      onSuccess: () => {
        message.success('Đã tạo bài tập');
        queryClient.invalidateQueries({ queryKey: ['admin-exercises'] });
        setCreateModalOpen(false);
        setVideoPreviewUrl('');
        setVideoLoadOk(false);
        setVideoCheckTriggered(false);
        createForm.resetFields();
      },
      onError: () => {
        message.error('Không thể tạo bài tập. Vui lòng thử lại.');
      },
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
    });
    setVideoPreviewUrl('');
    setVideoLoadOk(false);
    setVideoCheckTriggered(false);
    setCreateModalOpen(true);
  };

  const triggerVideoCheck = async () => {
    try {
      const url = await createForm.validateFields(['videoUrl']);
      const nextUrl = url.videoUrl.trim();
      setVideoCheckTriggered(true);
      setVideoLoadOk(false);
      setVideoPreviewUrl(nextUrl);
    } catch {
      // validation failed
    }
  };

  const handleCreateExercise = async () => {
    try {
      const values = await createForm.validateFields();
      if (!videoCheckTriggered || !videoLoadOk) {
        message.warning('Vui lòng kiểm tra URL video hiển thị được trước khi tạo.');
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
      title: 'Name',
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
      title: 'Muscle group',
      dataIndex: 'muscleGroup',
      key: 'muscleGroup',
      render: (v: Exercise['muscleGroup']) => muscleGroupLabels[v] ?? v,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (v: Exercise['level']) => levelLabels[v] ?? v,
    },
    {
      title: 'Equipments',
      dataIndex: 'equipments',
      key: 'equipments',
      ellipsis: true,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) =>
        active ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Created at',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: Exercise) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small">
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded bg-gray-50 p-4">
        <Search
          allowClear
          placeholder="Search by name or description..."
          className="max-w-md flex-1"
          onChange={handleSearch}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreateModal}
        >
          Add exercise
        </Button>
      </div>
      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<Exercise>
            columns={columns}
            dataSource={exercises}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{
              current: filters.page,
              pageSize: filters.itemsPerPage,
              total: data?.meta.total,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
          />
        )}
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
              <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="Description">
                <Typography.Paragraph className="mb-0">
                  {detail.description}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Content">
                <Typography.Paragraph className="mb-0 whitespace-pre-wrap">
                  {detail.content || '—'}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Muscle group">
                {muscleGroupLabels[detail.muscleGroup] ?? detail.muscleGroup}
              </Descriptions.Item>
              <Descriptions.Item label="Level">
                {levelLabels[detail.level] ?? detail.level}
              </Descriptions.Item>
              <Descriptions.Item label="Equipments">
                {detail.equipments || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Suggestion">
                {detail.suggestion || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                {detail.isActive ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag>No</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created at">
                {formatDate(detail.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated at">
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
        onCancel={() => {
          setCreateModalOpen(false);
          setVideoPreviewUrl('');
          setVideoLoadOk(false);
          setVideoCheckTriggered(false);
          createForm.resetFields();
        }}
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
              <Select options={createMuscleGroupOptions} />
            </Form.Item>
            <Form.Item
              name="level"
              label="Cấp độ"
              rules={[{ required: true, message: 'Chọn cấp độ' }]}
            >
              <Select options={createLevelOptions} />
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
                setVideoLoadOk(false);
              }}
            />
          </Form.Item>
          <div className="mb-3 flex items-center gap-3">
            <Button onClick={triggerVideoCheck}>Kiểm tra video</Button>
            {videoCheckTriggered ? (
              videoLoadOk ? (
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
          {videoPreviewUrl ? (
            <div className="mb-4 aspect-video w-full overflow-hidden rounded bg-neutral-900">
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
            <Input placeholder="Ví dụ: 3 hiệp x 12 lần (tùy chọn)" />
          </Form.Item>
          <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
