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
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';

import { buildAdminUpdatePayload } from '@/app/lib/adminAccountPayload';
import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { profileFieldRules } from '@/app/lib/profileValidation';
import {
  deactivateUserAccountByAdmin,
  getAccountUser,
  updateUserAccountByAdmin,
} from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  AdminUpdateUserRequest,
  UserAccount,
  UserAccountsResponse,
} from '@/app/types/types';
import { fitnessGoalLabel } from '@/app/lib/ptFitnessGoal';

const { Search } = Input;

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

function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const raw = axiosErr?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;
  return fallback;
}

export default function AdminUserPage() {
  const queryClient = useQueryClient();
  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

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

  const handleTableChange: TableProps<UserAccount>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage!,
    }));
  };

  const { data, isLoading } = useQuery<UserAccountsResponse>({
    queryKey: ['admin-users', filters],
    queryFn: () => getAccountUser(filters),
  });

  const usersData: UserAccount[] = data?.data ?? [];

  const { mutate: submitUpdate, isPending: isUpdating } = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminUpdateUserRequest;
    }) => updateUserAccountByAdmin(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Đã cập nhật hội viên');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-user-count'] });
      setEditOpen(false);
      setEditingUser(null);
      editForm.resetFields();
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể cập nhật hội viên'));
    },
  });

  const { mutate: submitDeactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => deactivateUserAccountByAdmin(id),
    onSuccess: (res) => {
      message.success(res.message || 'Đã vô hiệu hóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-user-count'] });
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể vô hiệu hóa tài khoản'));
    },
  });

  const openEdit = (record: UserAccount) => {
    setEditingUser(record);
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
    setEditingUser(null);
    editForm.resetFields();
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      const values = await editForm.validateFields();
      const payload = buildAdminUpdatePayload(values);
      if (Object.keys(payload).length === 0) {
        message.warning('Chưa có thay đổi nào để lưu');
        return;
      }
      submitUpdate({ id: editingUser.id, payload });
    } catch {
      // validation
    }
  };

  const columns: TableProps<UserAccount>['columns'] = [
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
      title: 'Mục tiêu',
      key: 'fitnessGoal',
      width: 140,
      render: (_: unknown, record) =>
        fitnessGoalLabel(record.profile?.fitnessGoal) || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string | undefined) =>
        status === 'ACTIVE' ? (
          <Tag color="green">Hoạt động</Tag>
        ) : status === 'INACTIVE' ? (
          <Tag color="default">Ngưng</Tag>
        ) : (
          <Tag>{status ?? '—'}</Tag>
        ),
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
            title="Vô hiệu hóa hội viên?"
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
      <div className="mb-8 rounded bg-gray-50 p-4">
        <Search placeholder="Tìm theo email hội viên" onChange={handleSearch} />
      </div>

      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table
            columns={columns}
            dataSource={usersData}
            rowKey="id"
            scroll={{ x: 800 }}
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
        title="Chỉnh sửa hội viên"
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
            <Input placeholder="user@email.com" />
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
