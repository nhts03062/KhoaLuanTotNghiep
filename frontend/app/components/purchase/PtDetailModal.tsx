'use client';

import { Avatar, Modal, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';

import {
  fitnessGoalLabel,
  fitnessGoalSpecialty,
  ptExpertiseIntro,
} from '@/app/lib/ptFitnessGoal';
import {
  displayPtHeightCm,
  displayPtName,
  displayPtWeightKg,
  genderLabelVi,
  resolvePtAvatarSrc,
} from '@/app/lib/ptProfileDisplay';
import { formatDate } from '@/app/utils/common';
import type { AvailablePtAccount } from '@/app/types/types';

const { Text, Paragraph } = Typography;

interface PtDetailModalProps {
  pt: AvailablePtAccount | null;
  open: boolean;
  onClose: () => void;
  onSelect?: (pt: AvailablePtAccount) => void;
  totalSlots?: number;
}

export default function PtDetailModal({
  pt,
  open,
  onClose,
  onSelect,
  totalSlots = 0,
}: PtDetailModalProps) {
  if (!pt) return null;

  const name = displayPtName(pt);
  const gLabel = genderLabelVi(pt.profile?.gender);
  const goalLabel = fitnessGoalLabel(pt.profile?.fitnessGoal);

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
      className="pt-detail-modal"
    >
      <div className="flex items-start gap-4">
        <Avatar
          size={72}
          src={resolvePtAvatarSrc(pt.profile?.avatar)}
          icon={!pt.profile?.avatar ? <UserOutlined /> : undefined}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-neutral-900">{name}</h3>
          <p className="mt-0.5 font-medium text-amber-600">
            {fitnessGoalSpecialty(pt.profile?.fitnessGoal)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {gLabel ? <Tag>{gLabel}</Tag> : null}
            {goalLabel ? <Tag color="blue">{goalLabel}</Tag> : null}
            {totalSlots > 0 ? (
              <Tag color="green">{totalSlots} ô lịch rảnh</Tag>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200/60 bg-amber-50/50 px-4 py-4">
        <Paragraph className="mb-2! text-xs font-semibold uppercase tracking-wide text-amber-800/80">
          Giới thiệu chuyên môn
        </Paragraph>
        <p className="text-sm leading-relaxed text-neutral-700">
          {ptExpertiseIntro(name, pt.profile?.fitnessGoal)}
        </p>
      </div>

      <div className="mt-4 space-y-2 text-sm text-neutral-700">
        <div className="flex gap-2">
          <MailOutlined className="mt-0.5 shrink-0 text-neutral-400" />
          <Text copyable={{ text: pt.email }} className="text-neutral-800">
            {pt.email}
          </Text>
        </div>
        {pt.profile?.phone ? (
          <p>
            <span className="text-neutral-500">Điện thoại: </span>
            <strong>{pt.profile.phone}</strong>
          </p>
        ) : null}
        {pt.profile?.dateOfBirth ? (
          <div className="flex gap-2">
            <CalendarOutlined className="mt-0.5 shrink-0 text-neutral-400" />
            <span>
              Ngày sinh: <strong>{formatDate(pt.profile.dateOfBirth)}</strong>
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <div className="text-xs text-neutral-500">Chiều cao</div>
          <div className="font-semibold text-neutral-900">
            {displayPtHeightCm(pt.profile?.height)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
          <div className="text-xs text-neutral-500">Cân nặng</div>
          <div className="font-semibold text-neutral-900">
            {displayPtWeightKg(pt.profile?.weight)}
          </div>
        </div>
      </div>

      {onSelect ? (
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onSelect(pt);
              onClose();
            }}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Chọn PT này
          </button>
        </div>
      ) : null}
    </Modal>
  );
}
