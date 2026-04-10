'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  TableProps,
  Tag,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import {
  createBranch,
  deleteBranch,
  getBranches,
  updateBranch,
} from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  Branch,
  BranchesResponse,
  CreateBranchRequest,
} from '@/app/types/types';
import { formatDate } from '@/app/utils/common';

const { Search } = Input;

export default function AdminBranchPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [createForm] = Form.useForm<CreateBranchRequest>();
  const [editForm] = Form.useForm<CreateBranchRequest>();

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: undefined,
  });

  const { data, isLoading } = useQuery<BranchesResponse>({
    queryKey: ['admin-branches', filters],
    queryFn: () => getBranches(filters),
  });

  const branches: Branch[] = data?.data ?? [];

  const { mutate: submitCreateBranch, isPending: isCreatingBranch } =
    useMutation({
      mutationFn: (payload: CreateBranchRequest) => createBranch(payload),
      onSuccess: () => {
        message.success('Đã tạo chi nhánh');
        queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
        setCreateModalOpen(false);
        createForm.resetFields();
      },
      onError: () => {
        message.error('Không thể tạo chi nhánh. Vui lòng thử lại.');
      },
    });

  const { mutate: submitUpdateBranch, isPending: isUpdatingBranch } =
    useMutation({
      mutationFn: (payload: { id: string; data: CreateBranchRequest }) =>
        updateBranch(payload.id, payload.data),
      onSuccess: () => {
        message.success('Đã cập nhật chi nhánh');
        queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
        setEditModalOpen(false);
        setEditingBranch(null);
        editForm.resetFields();
      },
      onError: () => {
        message.error('Không thể cập nhật chi nhánh. Vui lòng thử lại.');
      },
    });

  const { mutate: submitDeleteBranch, isPending: isDeletingBranch } =
    useMutation({
      mutationFn: (branchId: string) => deleteBranch(branchId),
      onSuccess: () => {
        message.success('Đã xóa chi nhánh');
        queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      },
      onError: () => {
        message.error('Không thể xóa chi nhánh. Vui lòng thử lại.');
      },
    });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const handleTableChange: TableProps<Branch>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage,
    }));
  };

  const handleCreateBranch = async () => {
    try {
      const values = await createForm.validateFields();
      submitCreateBranch({
        name: values.name.trim(),
        address: values.address.trim(),
        phone: values.phone.trim(),
      });
    } catch {
      // validation failed
    }
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);
    editForm.setFieldsValue({
      name: branch.name,
      address: branch.address ?? '',
      phone: branch.phone ?? '',
    });
    setEditModalOpen(true);
  };

  const handleUpdateBranch = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingBranch) return;
      submitUpdateBranch({
        id: editingBranch.id,
        data: {
          name: values.name.trim(),
          address: values.address.trim(),
          phone: values.phone.trim(),
        },
      });
    } catch {
      // validation failed
    }
  };

  const columns: TableProps<Branch>['columns'] = [
    {
      title: 'Tên chi nhánh',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (v?: string) => v || '—',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) =>
        active ? <Tag color="green">Đang hoạt động</Tag> : <Tag>Tạm ngưng</Tag>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: Branch) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Xóa chi nhánh"
            description={`Bạn có chắc muốn xóa "${record.name}"?`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: isDeletingBranch }}
            onConfirm={() => submitDeleteBranch(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-8 rounded bg-gray-50 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Search
            allowClear
            placeholder="Tìm theo tên, địa chỉ, số điện thoại..."
            className="max-w-md flex-1"
            onChange={handleSearch}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            Tạo chi nhánh
          </Button>
        </div>
      </div>

      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<Branch>
            columns={columns}
            dataSource={branches}
            rowKey="id"
            scroll={{ x: 960 }}
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
        title="Cập nhật chi nhánh"
        open={editModalOpen}
        onOk={handleUpdateBranch}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingBranch(null);
          editForm.resetFields();
        }}
        confirmLoading={isUpdatingBranch}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-3">
          <Form.Item
            name="name"
            label="Tên chi nhánh"
            rules={[{ required: true, message: 'Nhập tên chi nhánh' }]}
          >
            <Input placeholder="Ví dụ: BestGym Quận 1" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Nhập địa chỉ' }]}
          >
            <Input placeholder="Ví dụ: 123 Nguyễn Huệ, Q1, TP.HCM" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Nhập số điện thoại' }]}
          >
            <Input placeholder="Ví dụ: 0901234567" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo chi nhánh"
        open={createModalOpen}
        onOk={handleCreateBranch}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        confirmLoading={isCreatingBranch}
        okText="Tạo"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" className="mt-3">
          <Form.Item
            name="name"
            label="Tên chi nhánh"
            rules={[{ required: true, message: 'Nhập tên chi nhánh' }]}
          >
            <Input placeholder="Ví dụ: BestGym Quận 1" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true, message: 'Nhập địa chỉ' }]}
          >
            <Input placeholder="Ví dụ: 123 Nguyễn Huệ, Q1, TP.HCM" />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Nhập số điện thoại' }]}
          >
            <Input placeholder="Ví dụ: 0901234567" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
