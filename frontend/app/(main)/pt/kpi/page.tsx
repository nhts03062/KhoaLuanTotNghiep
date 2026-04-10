'use client';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import {
  PT_PAYOUT_STATUS_COLORS,
  PT_PAYOUT_STATUS_LABELS,
  formatMonthKeyVi,
  monthKeyFromDayjs,
} from '@/app/lib/ptKpiLabels';
import { getMyPtKpiMonthly } from '@/app/services/api';
import type { PtMonthlyKpiResponse } from '@/app/types/types';
import { formatNumber } from '@/app/utils/common';
import {
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  GiftOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Card,
  Descriptions,
  Empty,
  Progress,
  Tag,
  Typography,
} from 'antd';
import DatePicker from 'antd/es/date-picker';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

const { Text, Title } = Typography;

export default function PtKpiPage() {
  const [monthDate, setMonthDate] = useState<Dayjs>(dayjs().startOf('month'));
  const monthKey = useMemo(() => monthKeyFromDayjs(monthDate), [monthDate]);

  const { data, isLoading, isError } = useQuery<PtMonthlyKpiResponse>({
    queryKey: ['pt-kpi-monthly', monthKey],
    queryFn: () => getMyPtKpiMonthly(monthKey),
  });

  const kpi = data?.data;
  const hasPolicy =
    Boolean(
      kpi &&
        (kpi.kpiTarget.targetTrainees > 0 ||
          kpi.kpiTarget.targetSessions > 0 ||
          kpi.kpiTarget.rewardAmount > 0),
    );

  return (
    <div className="min-h-screen bg-background pb-16 pt-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Title level={3} className="mb-1!">
              KPI tháng của tôi
            </Title>
            <Text type="secondary">
              Theo dõi tiến độ KPI và phần thưởng dự kiến của bạn theo tháng.
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

        {isLoading ? (
          <SkeletonLoading />
        ) : isError || !kpi ? (
          <Empty description="Không tải được dữ liệu KPI" />
        ) : (
          <>
            {!hasPolicy ? (
              <Alert
                className="mb-6"
                type="info"
                showIcon
                message={`Chưa có chính sách KPI cho ${formatMonthKeyVi(monthKey)}`}
                description="Vui lòng đợi quản trị viên thiết lập mục tiêu cho tháng này."
              />
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card title="Tiến độ" className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Text strong>Học viên</Text>
                      <Text type="secondary">
                        {kpi.distinctTrainees} / {kpi.kpiTarget.targetTrainees}
                      </Text>
                    </div>
                    <Progress
                      percent={kpi.progress.traineePercent}
                      status={
                        kpi.progress.traineePercent >= 100 ? 'success' : 'active'
                      }
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <Text strong>Buổi tập</Text>
                      <Text type="secondary">
                        {kpi.acceptedSessions} / {kpi.kpiTarget.targetSessions}
                      </Text>
                    </div>
                    <Progress
                      percent={kpi.progress.sessionPercent}
                      status={
                        kpi.progress.sessionPercent >= 100 ? 'success' : 'active'
                      }
                    />
                  </div>
                </div>
              </Card>

              <Card
                title={
                  <span>
                    <TrophyOutlined className="mr-2" />
                    Trạng thái
                  </span>
                }
              >
                <div className="mb-4 flex items-center gap-3">
                  {kpi.achieved ? (
                    <>
                      <CheckCircleTwoTone
                        twoToneColor="#52c41a"
                        style={{ fontSize: 36 }}
                      />
                      <div>
                        <Tag color="green" className="text-base!">
                          Đã đạt KPI
                        </Tag>
                        <div className="mt-1">
                          <Text type="secondary">
                            Chúc mừng bạn đã hoàn thành mục tiêu tháng này!
                          </Text>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <ClockCircleTwoTone
                        twoToneColor="#faad14"
                        style={{ fontSize: 36 }}
                      />
                      <div>
                        <Tag>Chưa đạt</Tag>
                        <div className="mt-1">
                          <Text type="secondary">
                            Cố gắng thêm để hoàn thành KPI tháng này.
                          </Text>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="Phần thưởng dự kiến">
                    <Text strong>{formatNumber(kpi.estimatedReward)} đ</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái payout">
                    {kpi.payoutStatus ? (
                      <Tag color={PT_PAYOUT_STATUS_COLORS[kpi.payoutStatus]}>
                        {PT_PAYOUT_STATUS_LABELS[kpi.payoutStatus]}
                      </Tag>
                    ) : (
                      <Tag>Chưa finalize</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                title={
                  <span>
                    <GiftOutlined className="mr-2" />
                    Mục tiêu {formatMonthKeyVi(monthKey)}
                  </span>
                }
              >
                {hasPolicy ? (
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Học viên cần đạt">
                      {kpi.kpiTarget.targetTrainees}
                    </Descriptions.Item>
                    <Descriptions.Item label="Buổi tập cần đạt">
                      {kpi.kpiTarget.targetSessions}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phần thưởng">
                      {formatNumber(kpi.kpiTarget.rewardAmount)} đ
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có mục tiêu KPI cho tháng này"
                  />
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
