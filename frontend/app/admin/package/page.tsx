'use client';

import CreatePackageForm from '@/app/components/form/CreatePackageForm';
import EditPackageForm from '@/app/components/form/EditPackageForm';
import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { deletePackage, getPackages } from '@/app/services/api';
import { FILTER_PACKAGE_PROPS } from '@/app/types/filters';
import type { Package, PackagesResponse } from '@/app/types/types';
import { formatDate, formatNumber } from '@/app/utils/common';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Popconfirm,
  Select,
  Space,
  Table,
  TableProps,
  Tag,
  message,
} from 'antd';
import { useState } from 'react';

export default function AdminPackagePage() {
  const queryClient = useQueryClient();
  const [isCreatePackageModalOpen, setIsCreatePackageModalOpen] =
    useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [filters, setFilters] = useState<FILTER_PACKAGE_PROPS>({
    page: 1,
    itemsPerPage: 10,
    unit: undefined,
    isActive: undefined,
  });

  const { data, isLoading } = useQuery<PackagesResponse>({
    queryKey: ['packages', filters],
    queryFn: () => getPackages(filters),
  });

  const { mutate: submitDeletePackage, isPending: isDeletingPackage } =
    useMutation({
      mutationFn: (packageId: string) => deletePackage(packageId),
      onSuccess: () => {
        message.success('Đã xóa gói tập');
        queryClient.invalidateQueries({ queryKey: ['packages'] });
      },
      onError: (error: { response?: { data?: { message?: string } } }) => {
        message.error(
          error?.response?.data?.message ?? 'Không thể xóa gói tập',
        );
      },
    });

  const handleTableChange: TableProps<Package>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage,
    }));
  };

  const openEdit = (record: Package) => {
    setEditingPackage(record);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingPackage(null);
  };

  const columns: TableProps<Package>['columns'] = [
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 90,
      render: (u: string) => (u === 'DAY' ? 'Ngày' : 'Tháng'),
    },
    {
      title: 'Thời hạn',
      dataIndex: 'durationValue',
      key: 'durationValue',
      width: 100,
    },
    {
      title: 'PT',
      key: 'hasPt',
      width: 72,
      render: (_: unknown, record: Package) =>
        record.hasPt ? <CheckOutlined /> : <CloseOutlined />,
    },
    {
      title: 'Số buổi PT',
      dataIndex: 'ptSessionsIncluded',
      key: 'ptSessionsIncluded',
      width: 110,
      render: (_: unknown, record: Package) =>
        record.hasPt ? (record.ptSessionsIncluded ?? '—') : '—',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => formatNumber(price),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (active: boolean) =>
        active ? (
          <Tag color="green">Đang bán</Tag>
        ) : (
          <Tag>Ngưng bán</Tag>
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_: unknown, record: Package) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xóa gói tập"
            description={`Xóa gói "${record.name}"? Thao tác không hoàn tác.`}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: isDeletingPackage }}
            onConfirm={() => submitDeletePackage(record.id)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const packages: Package[] = data?.data ?? [];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end gap-3 rounded bg-gray-50 p-4">
        <div className="min-w-[160px]">
          <div className="mb-1 text-xs text-neutral-500">Đơn vị</div>
          <Select
            allowClear
            placeholder="Tất cả đơn vị"
            className="w-[180px]"
            value={filters.unit ?? null}
            options={[
              { value: 'DAY', label: 'Ngày' },
              { value: 'MONTH', label: 'Tháng' },
            ]}
            onChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                unit: (value ?? undefined) as 'DAY' | 'MONTH' | undefined,
                page: 1,
              }));
            }}
          />
        </div>
        <div className="min-w-[160px]">
          <div className="mb-1 text-xs text-neutral-500">Trạng thái</div>
          <Select
            className="w-[200px]"
            value={
              filters.isActive === undefined
                ? 'active_default'
                : filters.isActive
                  ? 'true'
                  : 'false'
            }
            options={[
              {
                value: 'active_default',
                label: 'Đang hoạt động (mặc định)',
              },
              { value: 'true', label: 'Chỉ đang bán' },
              { value: 'false', label: 'Chỉ ngưng bán' },
            ]}
            onChange={(value) => {
              if (value === 'active_default') {
                setFilters((prev) => ({
                  ...prev,
                  isActive: undefined,
                  page: 1,
                }));
              } else {
                setFilters((prev) => ({
                  ...prev,
                  isActive: value === 'true',
                  page: 1,
                }));
              }
            }}
          />
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="ml-auto"
          onClick={() => setIsCreatePackageModalOpen(true)}
        >
          Thêm gói
        </Button>
      </div>

      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<Package>
            columns={columns}
            dataSource={packages}
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

      <CreatePackageForm
        isOpen={isCreatePackageModalOpen}
        setIsOpen={setIsCreatePackageModalOpen}
        onClose={() => setIsCreatePackageModalOpen(false)}
      />
      <EditPackageForm open={editOpen} onClose={closeEdit} pkg={editingPackage} />
    </>
  );
}
