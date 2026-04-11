'use client';

import { Button, Card, Tag } from 'antd';
import { CalendarOutlined, IdcardOutlined, MessageOutlined } from '@ant-design/icons';
import type { PTAssistRequest } from '@/app/types/types';

type AssistStatus = PTAssistRequest['status'];

const statusTagMap: Record<AssistStatus, { color: string; label: string }> = {
  PENDING: { color: 'gold', label: 'Chờ xử lý' },
  ACCEPTED: { color: 'green', label: 'Đã chấp nhận' },
  REJECTED: { color: 'red', label: 'Từ chối' },
};

export default function PTAssistRequestCard({
  request,
  onAccept,
  onReject,
  isLoading = false,
}: {
  request: PTAssistRequest;
  onAccept?: (request: PTAssistRequest) => void;
  onReject?: (request: PTAssistRequest) => void;
  isLoading?: boolean;
}) {
  const statusTag = statusTagMap[request.status];

  const userName = request.account.profile?.name ?? request.account.email;
  const branchLabel = request.branch.name;
  const packageLabel = request.userPackage.package.name;

  return (
    <Card className="border-neutral-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <IdcardOutlined />
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
            <div className="text-xs text-neutral-500">{packageLabel}</div>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">
            <CalendarOutlined />
          </span>
          <span>
            {request.startTime
              ? `Từ ${new Date(request.startTime).toLocaleString('vi-VN')}`
              : 'Thời gian chưa có'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-400">
            <CalendarOutlined />
          </span>
          <span>
            {request.endTime
              ? `Đến ${new Date(request.endTime).toLocaleString('vi-VN')}`
              : 'Chưa có thời điểm kết thúc'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-neutral-500">{branchLabel}</span>
        </div>
        {request.note ? (
          <div className="flex items-start gap-2">
            <MessageOutlined className="mt-0.5 text-neutral-400" />
            <span className="text-neutral-600">{request.note}</span>
          </div>
        ) : null}
        {request.rejectReason ? (
          <div className="text-neutral-500">{request.rejectReason}</div>
        ) : null}
      </div>

      {request.status === 'PENDING' ? (
        <div className="mt-4 flex gap-2">
          <Button
            type="primary"
            block
            loading={isLoading}
            onClick={() => onAccept?.(request)}
          >
            Chấp nhận
          </Button>
          <Button
            danger
            block
            loading={isLoading}
            onClick={() => onReject?.(request)}
          >
            Từ chối
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

