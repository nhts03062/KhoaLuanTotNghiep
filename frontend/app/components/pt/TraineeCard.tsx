'use client';

import { Card, Tag, Button } from 'antd';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BookOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { TraineeRequest } from '@/app/types/types';

type TraineeStatus = TraineeRequest['status'];

const statusTagMap: Record<TraineeStatus, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Chờ duyệt' },
  ACTIVE: { color: 'green', label: 'Đang hoạt động' },
  EXPIRED: { color: 'red', label: 'Hết hạn' },
  CANCELLED: { color: 'default', label: 'Đã hủy' },
  REJECTED: { color: 'red', label: 'Bị từ chối' },
};

interface TraineeCardProps {
  trainee: TraineeRequest;
  mode: 'pending' | 'active';
  onApprove?: (trainee: TraineeRequest) => void;
  onReject?: (trainee: TraineeRequest) => void;
  onOpenDetail?: (trainee: TraineeRequest) => void;
}

export default function TraineeCard({
  trainee,
  mode,
  onApprove,
  onReject,
  onOpenDetail,
}: TraineeCardProps) {
  const statusTag = statusTagMap[trainee.status];

  const planLabel = trainee.package.name;
  const programLabel = trainee.program?.name ?? 'Chưa có chương trình';
  const locationLabel = trainee.branch.name;
  const userName = trainee.account.profile?.name ?? trainee.account.email;
  const email = trainee.account.email;
  const phone = (trainee.account as any).profile?.phone ?? undefined;
  const clickable = mode === 'active' && Boolean(onOpenDetail);

  return (
    <Card
      className={`${mode === 'pending' ? 'border-primary/20' : ''} ${
        clickable ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
      }`}
      onClick={clickable ? () => onOpenDetail?.(trainee) : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${
              mode === 'pending'
                ? 'bg-blue-50 text-blue-600'
                : 'bg-green-50 text-green-600'
            }`}
          >
            <UserOutlined />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900">
                {userName}
              </span>
              <Tag color={statusTag.color} className="text-[11px]">
                {statusTag.label}
              </Tag>
            </div>
            <div className="text-xs text-neutral-500">{planLabel}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <MailOutlined className="text-primary" />
          <span>{email}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-2">
            <PhoneOutlined className="text-primary" />
            <span>{phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-primary" />
          <span>{locationLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOutlined className="text-primary" />
          <span>Chương trình: {programLabel}</span>
        </div>
        {trainee.createdAt && (
          <div className="flex items-center gap-2">
            <CalendarOutlined className="text-primary" />
            <span>
              Ngày yêu cầu:{' '}
              {new Date(trainee.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>

      {mode === 'pending' && (onApprove || onReject) && (
        <div className="mt-4 flex gap-2">
          {onApprove && (
            <Button
              type="primary"
              block
              onClick={(e) => {
                e.stopPropagation();
                onApprove(trainee);
              }}
            >
              Duyệt
            </Button>
          )}
          {onReject && (
            <Button
              danger
              block
              onClick={(e) => {
                e.stopPropagation();
                onReject(trainee);
              }}
            >
              Từ chối
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
