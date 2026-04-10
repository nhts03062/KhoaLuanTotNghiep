'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  TableProps,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';

import { buildAdminUpdatePayload } from '@/app/lib/adminAccountPayload';
import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { fitnessGoalLabel } from '@/app/lib/ptFitnessGoal';
import { profileFieldRules } from '@/app/lib/profileValidation';
import {
  createPtAccount,
  deactivatePtAccountByAdmin,
  getPtAccounts,
  updatePtAccountByAdmin,
} from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  AdminUpdatePtRequest,
  CreatePtAccountRequest,
  PtAccount,
  PtAccountsResponse,
} from '@/app/types/types';

const { Search } = Input;
const { Text } = Typography;

const PT_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

const genderOptions = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
];

const fitnessGoalOptions = [
  { value: 'LOSE_WEIGHT', label: 'Giảm cân' },
  { value: 'GAIN_MUSCLE', label: 'Tăng cơ' },
  { value: 'IMPROVE_HEALTH', label: 'Cải thiện sức khỏe' },
  { value: 'MAINTAIN_WEIGHT', label: 'Duy trì cân nặng' },
];

function genderLabel(g?: string | null) {
  if (g === 'MALE') return 'Nam';
  if (g === 'FEMALE') return 'Nữ';
  return '—';
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const raw = axiosErr?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;
  return fallback;
}

export default function AdminPtPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreatePtAccountRequest>();
  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [editingPt, setEditingPt] = useState<PtAccount | null>(null);

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: '',
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1,
    });
  };

  const handleTableChange: TableProps<PtAccount>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage!,
    }));
  };

  const { data, isLoading } = useQuery<PtAccountsResponse>({
    queryKey: ['admin-pt', filters],
    queryFn: () => getPtAccounts(filters),
  });

  const ptData: PtAccount[] = data?.data ?? [];

  const { mutate: submitCreatePt, isPending: isCreatingPt } = useMutation({
    mutationFn: (payload: CreatePtAccountRequest) => createPtAccount(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Đã tạo tài khoản PT');
      queryClient.invalidateQueries({ queryKey: ['admin-pt'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pt-count'] });
      setCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể tạo tài khoản PT'));
    },
  });

  const { mutate: submitUpdate, isPending: isUpdating } = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminUpdatePtRequest;
    }) => updatePtAccountByAdmin(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Đã cập nhật PT');
      queryClient.invalidateQueries({ queryKey: ['admin-pt'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pt-count'] });
      setEditOpen(false);
      setEditingPt(null);
      editForm.resetFields();
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể cập nhật PT'));
    },
  });

  const { mutate: submitDeactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => deactivatePtAccountByAdmin(id),
    onSuccess: (res) => {
      message.success(res.message || 'Đã vô hiệu hóa tài khoản PT');
      queryClient.invalidateQueries({ queryKey: ['admin-pt'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pt-count'] });
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể vô hiệu hóa PT'));
    },
  });

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleCreatePt = async () => {
    try {
      const values = await createForm.validateFields();
      submitCreatePt({
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        gender: values.gender,
      });
    } catch {
      // validation failed
    }
  };

  const openEdit = (record: PtAccount) => {
    setEditingPt(record);
    editForm.setFieldsValue({
      email: record.email,
      name: record.profile?.name ?? '',
      gender: record.profile?.gender ?? undefined,
      phone: record.profile?.phone ?? '',
      dateOfBirth: record.profile?.dateOfBirth
        ? dayjs(record.profile.dateOfBirth)
        : undefined,
      avatar: record.profile?.avatar ?? '',
      height: record.profile?.height ?? undefined,
      weight: record.profile?.weight ?? undefined,
      fitnessGoal: record.profile?.fitnessGoal ?? undefined,
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingPt(null);
    editForm.resetFields();
  };

  const handleUpdate = async () => {
    if (!editingPt) return;
    try {
      const values = await editForm.validateFields();
      const payload = buildAdminUpdatePayload(values);
      if (Object.keys(payload).length === 0) {
        message.warning('Chưa có thay đổi nào để lưu');
        return;
      }
      submitUpdate({ id: editingPt.id, payload });
    } catch {
      // validation
    }
  };

  const columns: TableProps<PtAccount>['columns'] = [
    {
      title: 'Họ tên',
      key: 'name',
      ellipsis: true,
      render: (_: unknown, record) => record.profile?.name?.trim() || '—',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: 'SĐT',
      key: 'phone',
      width: 120,
      render: (_: unknown, record) => record.profile?.phone?.trim() || '—',
    },
    {
      title: 'Giới tính',
      key: 'gender',
      width: 100,
      render: (_: unknown, record) => genderLabel(record.profile?.gender),
    },
    {
      title: 'Mục tiêu',
      key: 'fitnessGoal',
      width: 140,
      render: (_: unknown, record) =>
        fitnessGoalLabel(record.profile?.fitnessGoal) || '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Vô hiệu hóa PT?"
            description={`Tài khoản ${record.email} sẽ chuyển sang trạng thái ngưng hoạt động.`}
            okText="Vô hiệu hóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: isDeactivating }}
            onConfirm={() => submitDeactivate(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded bg-gray-50 p-4">
        <div>
          <Text strong className="text-base!">
            Quản lý PT
          </Text>
          <div>
            <Text type="secondary" className="text-sm">
              Tạo, chỉnh sửa hoặc vô hiệu hóa tài khoản huấn luyện viên.
            </Text>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Tạo tài khoản PT
        </Button>
      </div>

      <div className="mb-8 rounded bg-gray-50 p-4">
        <Search
          placeholder="Tìm theo email PT..."
          allowClear
          onChange={handleSearch}
          className="max-w-md"
        />
      </div>

      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<PtAccount>
            columns={columns}
            dataSource={ptData}
            rowKey="id"
            scroll={{ x: 900 }}
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

      <Modal
        title="Tạo tài khoản PT"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreatePt}
        confirmLoading={isCreatingPt}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        destroyOnClose
        width={520}
      >
        <Form form={createForm} layout="vertical" className="mt-2">
          <Form.Item
            name="email"
            label="Email"
            rules={profileFieldRules.email}
          >
            <Input placeholder="pt@bestgym.com" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Họ tên"
            rules={profileFieldRules.name}
          >
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={profileFieldRules.phone}
            validateTrigger="onBlur"
          >
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              placeholder="Chọn giới tính"
              options={genderOptions}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
              {
                pattern: PT_PASSWORD_PATTERN,
                message:
                  'Cần chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)',
              },
            ]}
          >
            <Input.Password placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Nhập lại mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Mật khẩu nhập lại không khớp'),
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chỉnh sửa PT"
        open={editOpen}
        onCancel={closeEdit}
        onOk={handleUpdate}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={isUpdating}
        destroyOnClose
        width={560}
      >
        <Form form={editForm} layout="vertical" className="mt-2">
          <Form.Item
            name="email"
            label="Email"
            rules={profileFieldRules.email}
          >
            <Input placeholder="pt@bestgym.com" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Họ và tên"
            rules={profileFieldRules.name}
          >
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select allowClear options={genderOptions} placeholder="Chọn giới tính" />
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

          <Form.Item name="fitnessGoal" label="Mục tiêu luyện tập">
            <Select
              allowClear
              options={fitnessGoalOptions}
              placeholder="Chọn mục tiêu"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
