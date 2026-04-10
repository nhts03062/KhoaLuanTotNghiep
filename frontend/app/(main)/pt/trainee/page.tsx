'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  Descriptions,
  Form,
  Modal,
  Select,
  Spin,
  Tabs,
  Tag,
} from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import {
  acceptPTAssistRequest,
  assignProgramToUser,
  getAcceptedTraineeRequests,
  getPTAssistRequests,
  getPrograms,
  rejectPTAssistRequest,
} from '@/app/services/api';
import type {
  AssignProgramToUserRequest,
  PTAssistRequest,
  Program,
  ProgramsResponse,
  TraineeRequest,
} from '@/app/types/types';
import TraineeCard from '@/app/components/pt/TraineeCard';
import PTAssistRequestCard from '@/app/components/pt/PTAssistRequestCard';
import { useAuthStore } from '@/app/stores/authStore';

export default function TraineePage() {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();
  const [assignForm] = Form.useForm<{ programId: string }>();
  const [activeTab, setActiveTab] = useState<'active' | 'assist'>('active');
  const [selectedTrainee, setSelectedTrainee] = useState<TraineeRequest | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const { data: activeData, isLoading: isLoadingActive } = useQuery({
    queryKey: ['pt-trainee-active'],
    queryFn: () => getAcceptedTraineeRequests(),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const activeList: TraineeRequest[] = useMemo(() => {
    const raw: TraineeRequest[] = activeData?.data ?? [];
    const seen = new Set<string>();
    const deduped: TraineeRequest[] = [];
    for (const item of raw) {
      const key = item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    return deduped;
  }, [activeData]);

  const { data: assistData, isLoading: isLoadingAssist } = useQuery({
    queryKey: ['pt-assist-requests'],
    queryFn: () => getPTAssistRequests(),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const assistList: PTAssistRequest[] = useMemo(
    () => assistData?.data ?? [],
    [assistData],
  );

  const { data: programsRes, isLoading: isLoadingPrograms } =
    useQuery<ProgramsResponse>({
      queryKey: ['pt-programs-for-assign'],
      queryFn: () => getPrograms({ page: 1, itemsPerPage: 100 }),
      enabled: detailOpen || assignOpen,
    });

  const programs: Program[] = programsRes?.data ?? [];
  const programOptions = programs.map((program) => ({
    label: program.name,
    value: program.id,
  }));

  const { mutate: acceptAssistRequest, isPending: isAcceptingAssist } =
    useMutation({
      mutationFn: (request: PTAssistRequest) =>
        acceptPTAssistRequest(request.id),
      onSuccess: (_res, req) => {
        queryClient.invalidateQueries({ queryKey: ['pt-assist-requests'] });
        const name = req.account.profile?.name ?? req.account.email;
        message.success(`Đã chấp nhận yêu cầu hỗ trợ của ${name}.`);
      },
    });

  const { mutate: rejectAssistRequest, isPending: isRejectingAssist } =
    useMutation({
      mutationFn: (request: PTAssistRequest) =>
        rejectPTAssistRequest(request.id),
      onSuccess: (_res, req) => {
        queryClient.invalidateQueries({ queryKey: ['pt-assist-requests'] });
        const name = req.account.profile?.name ?? req.account.email;
        message.info(`Đã từ chối yêu cầu hỗ trợ của ${name}.`);
      },
    });

  const { mutate: submitAssignProgram, isPending: isAssigningProgram } =
    useMutation({
      mutationFn: (payload: AssignProgramToUserRequest) =>
        assignProgramToUser(payload),
      onSuccess: () => {
        message.success('Đã định hướng chương trình tập cho học viên.');
        setAssignOpen(false);
        assignForm.resetFields();
        queryClient.invalidateQueries({ queryKey: ['pt-trainee-active'] });
      },
      onError: () => {
        message.error('Không thể gán chương trình. Vui lòng thử lại.');
      },
    });

  const openTraineeDetail = (trainee: TraineeRequest) => {
    setSelectedTrainee(trainee);
    setDetailOpen(true);
  };

  const closeTraineeDetail = () => {
    setDetailOpen(false);
    setSelectedTrainee(null);
  };

  const openAssignProgramModal = () => {
    assignForm.setFieldsValue({ programId: undefined });
    setAssignOpen(true);
  };

  const handleAssignProgram = async () => {
    try {
      const values = await assignForm.validateFields();
      if (!selectedTrainee) return;
      submitAssignProgram({
        userPackageId: selectedTrainee.id,
        programId: values.programId,
      });
    } catch {
      // validation failed
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 pt-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground">
          Danh sách học viên
        </h1>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'active' | 'assist')}
          items={[
            {
              key: 'active',
              label: `Học viên của tôi (${activeList.length})`,
              children: isLoadingActive ? (
                <div className="flex justify-center py-10">
                  <Spin />
                </div>
              ) : activeList.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Chưa có học viên nào.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeList.map((trainee) => (
                    <TraineeCard
                      key={trainee.id}
                      trainee={trainee}
                      mode="active"
                      onOpenDetail={openTraineeDetail}
                    />
                  ))}
                </div>
              ),
            },
            {
              key: 'assist',
              label: `Yêu cầu hỗ trợ (${assistList.length})`,
              children: isLoadingAssist ? (
                <div className="flex justify-center py-10">
                  <Spin />
                </div>
              ) : assistList.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Không có yêu cầu hỗ trợ nào.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {assistList.map((req) => (
                    <PTAssistRequestCard
                      key={req.id}
                      request={req}
                      onAccept={acceptAssistRequest}
                      onReject={rejectAssistRequest}
                      isLoading={isAcceptingAssist || isRejectingAssist}
                    />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>

      <Modal
        title="Chi tiết học viên"
        open={detailOpen}
        onCancel={closeTraineeDetail}
        footer={[
          <Button key="close" onClick={closeTraineeDetail}>
            Đóng
          </Button>,
          <Button
            key="assign"
            type="primary"
            onClick={openAssignProgramModal}
            disabled={!selectedTrainee}
          >
            Định hướng luyện tập
          </Button>,
        ]}
        width={720}
        destroyOnClose
      >
        {selectedTrainee ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Tên">
              {selectedTrainee.account.profile?.name ??
                selectedTrainee.account.email}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedTrainee.account.email}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={selectedTrainee.status === 'ACTIVE' ? 'green' : 'gold'}
              >
                {selectedTrainee.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Gói tập">
              {selectedTrainee.package.name}
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {selectedTrainee.branch.name}
            </Descriptions.Item>
            <Descriptions.Item label="Chương trình luyện tập">
              {selectedTrainee.program?.name ?? 'Chưa có chương trình'}
            </Descriptions.Item>
            <Descriptions.Item label="Bắt đầu">
              {selectedTrainee.startAt
                ? new Date(selectedTrainee.startAt).toLocaleDateString('vi-VN')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Kết thúc">
              {selectedTrainee.endAt
                ? new Date(selectedTrainee.endAt).toLocaleDateString('vi-VN')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tham gia">
              {new Date(selectedTrainee.createdAt).toLocaleDateString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title="Định hướng luyện tập"
        open={assignOpen}
        onOk={handleAssignProgram}
        onCancel={() => {
          setAssignOpen(false);
          assignForm.resetFields();
        }}
        okText="Gán chương trình"
        cancelText="Hủy"
        confirmLoading={isAssigningProgram}
        destroyOnClose
      >
        <Form form={assignForm} layout="vertical" className="mt-2">
          <Form.Item
            name="programId"
            label="Chương trình tập"
            rules={[{ required: true, message: 'Chọn chương trình tập' }]}
          >
            <Select
              showSearch
              placeholder="Chọn chương trình phù hợp"
              loading={isLoadingPrograms}
              options={programOptions}
              optionFilterProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
