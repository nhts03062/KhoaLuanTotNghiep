/* eslint-disable react/jsx-key */
'use client';

import { Card, Col, Row, Skeleton, Tag } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { motion } from 'motion/react';
import type { Package } from '@/app/types/types';

interface SelectPackageStepProps {
  loading: boolean;
  packages: Package[];
  selectedPackageId: string | null;
  onSelect: (pkg: Package) => void;
}

export default function SelectPackageStep({
  loading,
  packages,
  selectedPackageId,
  onSelect,
}: SelectPackageStepProps) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">
          Chọn gói tập
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Lựa chọn gói tập phù hợp với mục tiêu và thời gian của bạn.
        </p>
      </motion.div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Col xs={24} md={8} key={index}>
              <Card>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          {packages.map((pkg, index) => {
            const isSelected = selectedPackageId === pkg.id;
            const unitLabel = pkg.unit === 'DAY' ? 'Ngày' : 'Tháng';
            const durationText = `${pkg.durationValue} ${unitLabel}`;

            return (
              <Col xs={24} md={8} key={pkg.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hoverable
                    onClick={() => onSelect(pkg)}
                    className={`h-full transition-all ${
                      isSelected
                        ? 'border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.6)]'
                        : ''
                    }`}
                    bodyStyle={{ padding: 20, height: '100%' }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-semibold text-neutral-900">
                          {pkg.name}
                        </h3>
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                          {durationText}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-white">
                          <CheckOutlined />
                        </span>
                      )}
                    </div>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-neutral-900">
                        {new Intl.NumberFormat('vi-VN').format(pkg.price)}₫
                      </span>
                      <span className="text-xs text-neutral-500">
                        / {durationText}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-xs text-neutral-600">
                      {pkg.description ||
                        'Gói tập linh hoạt, truy cập đầy đủ trang thiết bị và không gian tập luyện hiện đại.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Tag color={pkg.unit === 'DAY' ? 'blue' : 'green'}>
                        {pkg.unit === 'DAY' ? 'Theo ngày' : 'Theo tháng'}
                      </Tag>
                      <Tag color={pkg.hasPt ? 'gold' : 'default'}>
                        {pkg.hasPt ? 'Bao gồm PT' : 'Không bao gồm PT'}
                      </Tag>
                    </div>
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}

