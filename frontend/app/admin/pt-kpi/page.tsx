'use client';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import {
  PT_PAYOUT_STATUS_COLORS,
  PT_PAYOUT_STATUS_LABELS,
  PT_PAYOUT_STATUS_OPTIONS,
  formatMonthKeyVi,
  monthKeyFromDayjs,
} from '@/app/lib/ptKpiLabels';
import {
  getPtKpiMonthlySummary,
  getPtKpiPolicy,
  updatePtKpiPayout,
  upsertPtKpiPolicy,
} from '@/app/services/api';
import type {
  PtKpiMonthlySummaryResponse,
  PtKpiMonthlySummaryRow,
  PtKpiPolicyResponse,
  PtMonthlyRewardPayoutStatus,
  UpdatePtKpiPayoutRequest,
  UpsertPtKpiPolicyRequest,
} from '@/app/types/types';
import { formatNumber } from '@/app/utils/common';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Space,
  Switch,
  Table,
  TableProps,
  Tag,
  Typography,
  message,
} from 'antd';
import DatePicker from 'antd/es/date-picker';
import { AxiosError } from 'axios';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

const { Text, Title } = Typography;

type PolicyFormValues = {
  targetTrainees: number;
  targetSessions: number;
  rewardAmount: number;
  isActive: boolean;
};

type PayoutFormValues = {
  amountFinal: number;
  status: PtMonthlyRewardPayoutStatus;
  note?: string;
};

export default function AdminPtKpiPage() {
  const queryClient = useQueryClient();
  const [monthDate, setMonthDate] = useState<Dayjs>(dayjs().startOf('month'));
  const monthKey = useMemo(() => monthKeyFromDayjs(monthDate), [monthDate]);

  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [policyForm] = Form.useForm<PolicyFormValues>();

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutForm] = Form.useForm<PayoutFormValues>();
  const [editingRow, setEditingRow] = useState<PtKpiMonthlySummaryRow | null>(
    null,
  );

  const { data: policyRes, isLoading: policyLoading } =
    useQuery<PtKpiPolicyResponse>({
      queryKey: ['admin-pt-kpi-policy', monthKey],
      queryFn: () => getPtKpiPolicy(monthKey),
    });

  const policy = policyRes?.data ?? null;

  const { data: summaryRes, isLoading: summaryLoading } =
    useQuery<PtKpiMonthlySummaryResponse>({
      queryKey: ['admin-pt-kpi-summary', monthKey],
      queryFn: () => getPtKpiMonthlySummary(monthKey),
    });

  const rows: PtKpiMonthlySummaryRow[] = summaryRes?.data?.rows ?? [];

  const handleApiError = (err: unknown, fallback: string) => {
    const axiosErr = err as AxiosError<{ message?: string }>;
    message.error(axiosErr?.response?.data?.message ?? fallback);
  };

  const { mutate: submitPolicy, isPending: isSavingPolicy } = useMutation({
    mutationFn: (payload: UpsertPtKpiPolicyRequest) =>
      upsertPtKpiPolicy(payload),
    onSuccess: () => {
      message.success('Đã lưu chính sách KPI');
      queryClient.invalidateQueries({
        queryKey: ['admin-pt-kpi-policy', monthKey],
      });
      queryClient.invalidateQueries({
        queryKey: ['admin-pt-kpi-summary', monthKey],
      });
      closePolicyModal();
    },
    onError: (err) => handleApiError(err, 'Không thể lưu chính sách KPI.'),
  });

  const { mutate: submitPayout, isPending: isSavingPayout } = useMutation({
    mutationFn: ({
      payoutId,
      payload,
    }: {
      payoutId: string;
      payload: UpdatePtKpiPayoutRequest;
    }) => updatePtKpiPayout(payoutId, payload),
    onSuccess: () => {
      message.success('Đã cập nhật payout');
      queryClient.invalidateQueries({
        queryKey: ['admin-pt-kpi-summary', monthKey],
      });
      closePayoutModal();
    },
    onError: (err) => handleApiError(err, 'Không thể cập nhật payout.'),
  });

  const openPolicyModal = () => {
    policyForm.setFieldsValue({
      targetTrainees: policy?.targetTrainees ?? 0,
      targetSessions: policy?.targetSessions ?? 0,
      rewardAmount: policy?.rewardAmount ?? 0,
      isActive: policy?.isActive ?? true,
    });
    setPolicyModalOpen(true);
  };

  const closePolicyModal = () => {
    setPolicyModalOpen(false);
    policyForm.resetFields();
  };

  const handleSavePolicy = async () => {
    try {
      const values = await policyForm.validateFields();
      submitPolicy({
        monthKey,
        targetTrainees: values.targetTrainees,
        targetSessions: values.targetSessions,
        rewardAmount: values.rewardAmount,
        isActive: values.isActive,
      });
    } catch {
      // validation failed
    }
  };

  const openPayoutModal = (row: PtKpiMonthlySummaryRow) => {
    if (!row.payout) {
      message.warning(
        'Tháng này chưa được finalize. Hệ thống sẽ tự tạo payout sau khi cron chạy.',
      );
      return;
    }
    setEditingRow(row);
    payoutForm.setFieldsValue({
      amountFinal: row.payout.amountFinal,
      status: row.payout.status,
      note: row.payout.note ?? '',
    });
    setPayoutModalOpen(true);
  };

  const closePayoutModal = () => {
    setPayoutModalOpen(false);
    setEditingRow(null);
    payoutForm.resetFields();
  };

  const handleSavePayout = async () => {
    if (!editingRow?.payout) return;
    try {
      const values = await payoutForm.validateFields();
      submitPayout({
        payoutId: editingRow.payout.id,
        payload: {
          amountFinal: values.amountFinal,
          status: values.status,
          note: values.note?.trim() || undefined,
        },
      });
    } catch {
      // validation failed
    }
  };

  const columns: TableProps<PtKpiMonthlySummaryRow>['columns'] = [
    {
      title: 'PT',
      key: 'pt',
      render: (_, record) => (
        <Space>
          <Avatar src={record.avatar || undefined}>
            {(record.name ?? record.email).charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium text-neutral-900">
              {record.name ?? '—'}
            </div>
            <Text type="secondary" className="text-xs">
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Học viên',
      key: 'trainees',
      width: 200,
      render: (_, record) => {
        const target = policy?.targetTrainees ?? 0;
        const percent =
          target > 0
            ? Math.min(100, Math.floor((record.distinctTrainees * 100) / target))
            : 0;
        return (
          <div>
            <div className="mb-1 text-sm">
              <span className="font-medium">{record.distinctTrainees}</span>
              <Text type="secondary"> / {target}</Text>
            </div>
            <Progress percent={percent} size="small" showInfo={false} />
          </div>
        );
      },
    },
    {
      title: 'Buổi tập',
      key: 'sessions',
      width: 200,
      render: (_, record) => {
        const target = policy?.targetSessions ?? 0;
        const percent =
          target > 0
            ? Math.min(100, Math.floor((record.acceptedSessions * 100) / target))
            : 0;
        return (
          <div>
            <div className="mb-1 text-sm">
              <span className="font-medium">{record.acceptedSessions}</span>
              <Text type="secondary"> / {target}</Text>
            </div>
            <Progress percent={percent} size="small" showInfo={false} />
          </div>
        );
      },
    },
    {
      title: 'Đạt KPI',
      key: 'achieved',
      width: 110,
      render: (_, record) =>
        record.achieved ? (
          <Tag color="green">Đạt</Tag>
        ) : (
          <Tag>Chưa đạt</Tag>
        ),
    },
    {
      title: 'Reward auto',
      key: 'rewardAuto',
      width: 140,
      render: (_, record) => (
        <Text>{formatNumber(record.rewardAmountAuto)} đ</Text>
      ),
    },
    {
      title: 'Payout',
      key: 'payout',
      width: 220,
      render: (_, record) => {
        if (!record.payout) {
          return <Tag>Chưa finalize</Tag>;
        }
        return (
          <Space direction="vertical" size={2}>
            <Text strong>{formatNumber(record.payout.amountFinal)} đ</Text>
            <Tag color={PT_PAYOUT_STATUS_COLORS[record.payout.status]}>
              {PT_PAYOUT_STATUS_LABELS[record.payout.status]}
            </Tag>
            {record.payout.source === 'MANUAL_OVERRIDE' ? (
              <Text type="secondary" className="text-xs">
                Đã chỉnh tay
              </Text>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => openPayoutModal(record)}
          disabled={!record.payout}
        >
          Sửa payout
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Title level={3} className="mb-1!">
            KPI hằng tháng PT
          </Title>
          <Text type="secondary">
            Cấu hình KPI tháng và theo dõi thành tích, payout của các PT.
          </Text>
        </div>
        <DatePicker
          picker="month"
          value={monthDate}
          allowClear={false}
          onChange={(d) => d && setMonthDate(d.startOf('month'))}
          format="MM/YYYY"
        />
      </div>

      <Card
        title={`Chính sách KPI ${formatMonthKeyVi(monthKey)}`}
        className="mb-6"
        extra={
          <Button
            type="primary"
            icon={policy ? <EditOutlined /> : <PlusOutlined />}
            onClick={openPolicyModal}
          >
            {policy ? 'Cập nhật' : 'Tạo chính sách'}
          </Button>
        }
      >
        {policyLoading ? (
          <SkeletonLoading />
        ) : !policy ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                Chưa có chính sách KPI cho {formatMonthKeyVi(monthKey)}. Hãy tạo
                để bắt đầu tính KPI.
              </span>
            }
          />
        ) : (
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
            <Descriptions.Item label="Mục tiêu học viên">
              {policy.targetTrainees}
            </Descriptions.Item>
            <Descriptions.Item label="Mục tiêu buổi tập">
              {policy.targetSessions}
            </Descriptions.Item>
            <Descriptions.Item label="Phần thưởng">
              {formatNumber(policy.rewardAmount)} đ
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {policy.isActive ? (
                <Tag color="green">Đang áp dụng</Tag>
              ) : (
                <Tag>Tạm dừng</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Người tạo">
              {policy.createdByAdmin?.email ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật">
              {new Date(policy.updatedAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title={`Bảng tổng hợp PT ${formatMonthKeyVi(monthKey)}`}>
        {summaryLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<PtKpiMonthlySummaryRow>
            columns={columns}
            dataSource={rows}
            rowKey="ptAccountId"
            scroll={{ x: 1100 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        )}
      </Card>

      <Modal
        title={`Chính sách KPI ${formatMonthKeyVi(monthKey)}`}
        open={policyModalOpen}
        onOk={handleSavePolicy}
        onCancel={closePolicyModal}
        confirmLoading={isSavingPolicy}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width={520}
      >
        <Form form={policyForm} layout="vertical" className="mt-2">
          <Form.Item
            name="targetTrainees"
            label="Số học viên tối thiểu"
            rules={[
              { required: true, message: 'Nhập số học viên' },
              { type: 'number', min: 0, message: 'Không âm' },
            ]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="targetSessions"
            label="Số buổi tập tối thiểu"
            rules={[
              { required: true, message: 'Nhập số buổi tập' },
              { type: 'number', min: 0, message: 'Không âm' },
            ]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            name="rewardAmount"
            label="Phần thưởng (VND)"
            rules={[
              { required: true, message: 'Nhập phần thưởng' },
              { type: 'number', min: 0, message: 'Không âm' },
            ]}
          >
            <InputNumber<number>
              min={0}
              step={100000}
              className="w-full"
              formatter={(v) =>
                `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={((v: string | undefined) =>
                Number((v ?? '').replace(/\D/g, ''))) as never}
            />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="Áp dụng"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingRow
            ? `Sửa payout · ${editingRow.name ?? editingRow.email}`
            : 'Sửa payout'
        }
        open={payoutModalOpen}
        onOk={handleSavePayout}
        onCancel={closePayoutModal}
        confirmLoading={isSavingPayout}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
        width={520}
      >
        {editingRow?.payout ? (
          <>
            <Descriptions
              column={1}
              bordered
              size="small"
              className="mb-4"
            >
              <Descriptions.Item label="Reward auto (gốc)">
                {formatNumber(editingRow.payout.amountAuto)} đ
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn">
                {editingRow.payout.source === 'AUTO'
                  ? 'Tự động'
                  : 'Đã chỉnh tay'}
              </Descriptions.Item>
            </Descriptions>
            <Form form={payoutForm} layout="vertical">
              <Form.Item
                name="amountFinal"
                label="Số tiền payout (VND)"
                rules={[
                  { required: true, message: 'Nhập số tiền' },
                  { type: 'number', min: 0, message: 'Không âm' },
                ]}
              >
                <InputNumber<number>
                  min={0}
                  step={100000}
                  className="w-full"
                  formatter={(v) =>
                    `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={((v: string | undefined) =>
                    Number((v ?? '').replace(/\D/g, ''))) as never}
                />
              </Form.Item>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Chọn trạng thái' }]}
              >
                <Select options={PT_PAYOUT_STATUS_OPTIONS} />
              </Form.Item>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>
          </>
        ) : null}
      </Modal>
    </>
  );
}
