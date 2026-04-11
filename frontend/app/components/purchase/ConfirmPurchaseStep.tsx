'use client';

import { Descriptions, Result } from 'antd';
import { motion } from 'motion/react';
import type { Branch, Package } from '@/app/types/types';

interface ConfirmPurchaseStepProps {
  selectedPackage: Package | null;
  selectedBranch: Branch | null;
}

export default function ConfirmPurchaseStep({
  selectedPackage,
  selectedBranch,
}: ConfirmPurchaseStepProps) {
  if (!selectedPackage || !selectedBranch) {
    return (
      <Result
        status="warning"
        title="Bạn chưa chọn đầy đủ thông tin"
        subTitle="Vui lòng quay lại các bước trước để chọn gói tập và cơ sở."
      />
    );
  }

  const unitLabel = selectedPackage.unit === 'DAY' ? 'Ngày' : 'Tháng';
  const durationText = `${selectedPackage.durationValue} ${unitLabel}`;
  const ptSessions = selectedPackage.ptSessionsIncluded ?? 0;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">
          Xác nhận đăng ký gói tập
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Vui lòng kiểm tra lại thông tin. Bạn sẽ được chuyển sang cổng VNPay để
          thanh toán, sau đó hệ thống tự kích hoạt gói tập.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-auto max-w-xl"
      >
        <Descriptions
          bordered
          column={1}
          size="middle"
          labelStyle={{ width: 160 }}
        >
          <Descriptions.Item label="Gói tập">
            {selectedPackage.name}
          </Descriptions.Item>
          <Descriptions.Item label="Thời hạn">
            {durationText}
          </Descriptions.Item>
          <Descriptions.Item label="Giá">
            {new Intl.NumberFormat('vi-VN').format(selectedPackage.price)}₫
          </Descriptions.Item>
          <Descriptions.Item label="Cơ sở tập luyện">
            {selectedBranch.name}
            {selectedBranch.address && ` - ${selectedBranch.address}`}
          </Descriptions.Item>
          {selectedPackage.hasPt && (
            <Descriptions.Item label="Số buổi PT">
              {ptSessions > 0 ? `${ptSessions} buổi` : 'Chưa cấu hình'}
            </Descriptions.Item>
          )}
        </Descriptions>

        <p className="mt-4 text-center text-xs text-neutral-500">
          Hỗ trợ thanh toán qua VNPay (thẻ ATM, Internet Banking, QR...). Giao
          dịch có hiệu lực trong 15 phút.
        </p>
        {selectedPackage.hasPt ? (
          <p className="mt-2 text-center text-xs text-neutral-500">
            Sau khi thanh toán, bạn có thể đặt từng buổi tập với PT trong mục
            &quot;Gói tập của tôi&quot;.
          </p>
        ) : null}
      </motion.div>
    </div>
  );
}
