'use client';

import { Card, Col, Row, Skeleton, Tag } from 'antd';
import { EnvironmentOutlined, CheckOutlined } from '@ant-design/icons';
import { motion } from 'motion/react';
import type { Branch } from '@/app/types/types';

interface SelectBranchStepProps {
  loading: boolean;
  branches: Branch[];
  selectedBranchId: string | null;
  onSelect: (branch: Branch) => void;
}

export default function SelectBranchStep({
  loading,
  branches,
  selectedBranchId,
  onSelect,
}: SelectBranchStepProps) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">
          Chọn cơ sở tập luyện
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Hãy chọn cơ sở gần bạn nhất để thuận tiện cho việc tập luyện.
        </p>
      </motion.div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Col xs={24} md={12} key={index}>
              <Card>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Row gutter={[16, 16]}>
          {branches.map((branch, index) => {
            const isSelected = selectedBranchId === branch.id;
            return (
              <Col xs={24} md={12} key={branch.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hoverable
                    onClick={() => onSelect(branch)}
                    className={`transition-all ${
                      isSelected
                        ? 'border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.6)]'
                        : ''
                    }`}
                    bodyStyle={{ padding: 18 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
                          <EnvironmentOutlined />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-neutral-900">
                            {branch.name}
                          </h3>
                          {branch.address && (
                            <p className="mt-1 text-xs text-neutral-600">
                              {branch.address}
                            </p>
                          )}
                          {branch.phone && (
                            <p className="mt-0.5 text-xs text-neutral-500">
                              Điện thoại: {branch.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-white">
                          <CheckOutlined />
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <Tag color={branch.isActive ? 'green' : 'red'}>
                        {branch.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
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

