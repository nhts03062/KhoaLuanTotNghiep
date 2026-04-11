'use client';

import { updatePackage } from '@/app/services/api';
import type { Package, UpdatePackageRequest } from '@/app/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Switch,
} from 'antd';
import { useEffect } from 'react';

interface EditPackageFormProps {
  open: boolean;
  onClose: () => void;
  pkg: Package | null;
}

type FieldType = {
  name?: string;
  description?: string;
  unit?: 'DAY' | 'MONTH';
  durationValue?: number;
  hasPt?: boolean;
  ptSessionsIncluded?: number;
  price?: number;
  isActive?: boolean;
};

export default function EditPackageForm({
  open,
  onClose,
  pkg,
}: EditPackageFormProps) {
  const [form] = Form.useForm<FieldType>();
  const queryClient = useQueryClient();
  const watchHasPt = Form.useWatch('hasPt', form);

  useEffect(() => {
    if (!open || !pkg) return;
    form.setFieldsValue({
      name: pkg.name,
      description: pkg.description ?? '',
      unit: pkg.unit,
      durationValue: pkg.durationValue,
      hasPt: pkg.hasPt,
      ptSessionsIncluded: pkg.ptSessionsIncluded ?? undefined,
      price: pkg.price,
      isActive: pkg.isActive,
    });
  }, [open, pkg, form]);

  const { mutate, isPending } = useMutation({
    mutationFn: (args: { id: string; body: UpdatePackageRequest }) =>
      updatePackage(args.id, args.body),
    onSuccess: () => {
      message.success('Cập nhật gói tập thành công');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      form.resetFields();
      onClose();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      message.error(
        error?.response?.data?.message ?? 'Cập nhật gói tập thất bại',
      );
    },
  });

  const onFinish = async (values: FieldType) => {
    if (!pkg) return;
    const body: UpdatePackageRequest = {
      name: values.name ?? '',
      description: values.description ?? '',
      unit: values.unit as 'DAY' | 'MONTH',
      durationValue: values.durationValue ?? 0,
      hasPt: !!values.hasPt,
      price: values.price ?? 0,
      isActive: values.isActive ?? true,
    };
    if (values.hasPt) {
      body.ptSessionsIncluded = values.ptSessionsIncluded ?? 0;
    }
    mutate({ id: pkg.id, body });
  };

  return (
    <Modal
      title="Chỉnh sửa gói tập"
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={isPending}
      onOk={() => form.submit()}
      destroyOnClose
      afterClose={() => form.resetFields()}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item<FieldType>
          label="Tên gói"
          name="name"
          rules={[{ required: true, message: 'Nhập tên gói' }]}
        >
          <Input placeholder="Tên gói" />
        </Form.Item>
        <Form.Item<FieldType>
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: 'Nhập mô tả' }]}
        >
          <Input placeholder="Mô tả" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item<FieldType>
              label="Đơn vị"
              name="unit"
              rules={[{ required: true, message: 'Chọn đơn vị' }]}
            >
              <Select
                options={[
                  { value: 'DAY', label: 'Ngày' },
                  { value: 'MONTH', label: 'Tháng' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<FieldType>
              label="Thời hạn (số)"
              name="durationValue"
              rules={[{ required: true, message: 'Nhập thời hạn' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item<FieldType> label="Giá (VND)" name="price">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                addonAfter="VND"
                formatter={(value) =>
                  ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<FieldType>
              label="Kèm PT"
              name="hasPt"
              valuePropName="checked"
            >
              <Checkbox>Có buổi PT</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        {watchHasPt ? (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item<FieldType>
                label="Số buổi PT"
                name="ptSessionsIncluded"
                rules={[
                  { required: true, message: 'Nhập số buổi PT' },
                ]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        ) : null}
        <Form.Item<FieldType>
          label="Trạng thái"
          name="isActive"
          valuePropName="checked"
        >
          <Switch checkedChildren="Đang bán" unCheckedChildren="Ngưng" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
