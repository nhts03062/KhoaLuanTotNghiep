'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Descriptions,
  Modal,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import viLocale from '@fullcalendar/core/locales/vi';
import type { DayCellMountArg, EventInput } from '@fullcalendar/core';
import { useQuery } from '@tanstack/react-query';
import { CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';

import { getCheckInHistory, getPTTrainingHistory } from '@/app/services/api';
import { useAuthStore } from '@/app/stores/authStore';
import { appRoute } from '@/app/config/appRoute';
import type {
  CheckInHistoryItem,
  CheckInHistoryResponse,
  PTTrainingHistoriesResponse,
  PTTrainingHistory,
} from '@/app/types/types';

dayjs.locale('vi');

const { Title, Text } = Typography;

function normalizeDateKey(key: string): string {
  const slice = key.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(slice)) return slice;
  return dayjs(key).format('YYYY-MM-DD');
}

function formatCheckInTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatPtRange(start: string, end: string): string {
  return `${dayjs(start).format('DD/MM/YYYY HH:mm')} — ${dayjs(end).format('HH:mm')}`;
}

function ptStatusColor(
  status: PTTrainingHistory['status'],
): 'green' | 'red' | 'orange' | 'default' {
  switch (status) {
    case 'ACCEPTED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'PENDING':
      return 'orange';
    default:
      return 'default';
  }
}

function ptStatusLabel(status: PTTrainingHistory['status']): string {
  const map: Record<PTTrainingHistory['status'], string> = {
    PENDING: 'Chờ xác nhận',
    ACCEPTED: 'Đã xác nhận',
    REJECTED: 'Từ chối',
    CANCELLED: 'Đã hủy',
  };
  return map[status] ?? status;
}

export default function MySchedulePage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.replace(appRoute.home.root);
    }
  }, [authLoading, isLoggedIn, router]);

  const checkInCalendarRef = useRef<InstanceType<typeof FullCalendar> | null>(
    null,
  );
  const ptCalendarRef = useRef<InstanceType<typeof FullCalendar> | null>(null);

  const [activeTab, setActiveTab] = useState<'checkin' | 'pt'>('checkin');
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    dayjs().format('YYYY-MM-DD'),
  );
  const [selectedPtDate, setSelectedPtDate] = useState<string>(() =>
    dayjs().format('YYYY-MM-DD'),
  );
  const [ptDetail, setPtDetail] = useState<PTTrainingHistory | null>(null);

  const { data, isLoading, isError } = useQuery<CheckInHistoryResponse>({
    queryKey: ['check-in-history'],
    queryFn: () => getCheckInHistory(),
    enabled: isLoggedIn,
  });

  const {
    data: ptHistoryRes,
    isLoading: ptLoading,
    isError: ptError,
  } = useQuery<PTTrainingHistoriesResponse>({
    queryKey: ['pt-training-history'],
    queryFn: () => getPTTrainingHistory(),
    enabled: isLoggedIn,
  });

  /** FullCalendar đo sai kích thước khi nằm trong tab ẩn; cần updateSize khi tab hiện / dữ liệu xong. */
  useLayoutEffect(() => {
    const run = () => {
      if (activeTab === 'checkin' && !isLoading) {
        checkInCalendarRef.current?.getApi().updateSize();
      }
      if (activeTab === 'pt' && !ptLoading) {
        ptCalendarRef.current?.getApi().updateSize();
      }
    };
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(run);
    });
    return () => cancelAnimationFrame(id);
  }, [activeTab, isLoading, ptLoading]);

  const checkInMap = useMemo(() => {
    const raw = data?.data ?? {};
    const map = new Map<string, CheckInHistoryItem[]>();
    for (const [k, items] of Object.entries(raw)) {
      const key = normalizeDateKey(k);
      const prev = map.get(key) ?? [];
      map.set(key, [...prev, ...items]);
    }
    return map;
  }, [data]);

  const ptHistoryByDate = useMemo(() => {
    const list = ptHistoryRes?.data ?? [];
    const map = new Map<string, PTTrainingHistory[]>();
    for (const item of list) {
      const key = dayjs(item.startTime).format('YYYY-MM-DD');
      const prev = map.get(key) ?? [];
      map.set(key, [...prev, item]);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
      );
    }
    return map;
  }, [ptHistoryRes?.data]);

  const calendarEvents = useMemo<EventInput[]>(
    () =>
      Array.from(checkInMap.entries()).map(([date, items]) => ({
        id: date,
        title:
          items.length > 1 ? `Đã check-in (${items.length})` : 'Đã check-in',
        start: date,
        allDay: true,
        classNames: ['my-checkin-event'],
      })),
    [checkInMap],
  );

  const ptCalendarEvents = useMemo<EventInput[]>(
    () =>
      Array.from(ptHistoryByDate.entries()).map(([date, items]) => ({
        id: `pt-${date}`,
        title:
          items.length > 1 ? `Buổi PT (${items.length})` : 'Buổi tập PT',
        start: date,
        allDay: true,
        classNames: ['my-pt-training-event'],
      })),
    [ptHistoryByDate],
  );

  const selectedItems = checkInMap.get(selectedDate) ?? [];
  const selectedPtItems = ptHistoryByDate.get(selectedPtDate) ?? [];

  const onCheckInDayCellMount = (arg: DayCellMountArg) => {
    const key = dayjs(arg.date).format('YYYY-MM-DD');
    arg.el.style.cursor = 'pointer';
    arg.el.onclick = () => setSelectedDate(key);
  };

  const onPtDayCellMount = (arg: DayCellMountArg) => {
    const key = dayjs(arg.date).format('YYYY-MM-DD');
    arg.el.style.cursor = 'pointer';
    arg.el.onclick = () => setSelectedPtDate(key);
  };

  const checkInTabContent = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
        <CheckCircleOutlined className="text-lg" />
        <span>
          Ngày có nhãn <strong>Đã check-in</strong> là ngày bạn có ít nhất một
          lần check-in.
        </span>
      </div>

      {isError ? (
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Không tải được lịch sử check-in. Vui lòng thử lại sau.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : (
          <div className="my-schedule-fullcalendar p-3 sm:p-5">
            <FullCalendar
              ref={checkInCalendarRef}
              plugins={[dayGridPlugin]}
              locale={viLocale}
              initialView="dayGridMonth"
              initialDate={selectedDate}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: '',
              }}
              height="auto"
              events={calendarEvents}
              dayCellDidMount={onCheckInDayCellMount}
              dayCellClassNames={(arg) => {
                const key = dayjs(arg.date).format('YYYY-MM-DD');
                return key === selectedDate ? ['selected-day-cell'] : [];
              }}
              eventDisplay="block"
              dayMaxEvents
            />
          </div>
        )}
      </div>

      <div className="mt-8 rounded-sm border border-neutral-200 bg-white p-5 shadow-sm">
        <Title level={5} className="mb-3! mt-0! text-neutral-900!">
          Chi tiết ngày {dayjs(selectedDate).format('DD/MM/YYYY')}
        </Title>
        {selectedItems.length === 0 ? (
          <Text type="secondary">
            Chưa có lượt check-in nào trong ngày này.
          </Text>
        ) : (
          <ul className="space-y-3">
            {selectedItems.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-1 rounded-sm border border-neutral-100 bg-neutral-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium text-neutral-900">
                  {item.branch.name}
                </span>
                <span className="text-sm text-neutral-600">
                  {formatCheckInTime(item.checkedInAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  const ptTabContent = (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
        <TeamOutlined className="text-lg" />
        <span>
          Chọn ngày trên lịch để xem các buổi tập với PT; bấm vào một buổi để
          xem chi tiết và nhận xét (nếu PT đã gửi).
        </span>
      </div>

      {ptError ? (
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Không tải được lịch sử tập với PT. Vui lòng thử lại sau.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
        {ptLoading ? (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        ) : (
          <div className="my-schedule-fullcalendar p-3 sm:p-5">
            <FullCalendar
              ref={ptCalendarRef}
              plugins={[dayGridPlugin]}
              locale={viLocale}
              initialView="dayGridMonth"
              initialDate={selectedPtDate}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: '',
              }}
              height="auto"
              events={ptCalendarEvents}
              dayCellDidMount={onPtDayCellMount}
              dayCellClassNames={(arg) => {
                const key = dayjs(arg.date).format('YYYY-MM-DD');
                return key === selectedPtDate ? ['selected-day-cell-pt'] : [];
              }}
              eventDisplay="block"
              dayMaxEvents
            />
          </div>
        )}
      </div>

      <div className="mt-8 rounded-sm border border-neutral-200 bg-white p-5 shadow-sm">
        <Title level={5} className="mb-3! mt-0! text-neutral-900!">
          Buổi tập ngày {dayjs(selectedPtDate).format('DD/MM/YYYY')}
        </Title>
        {selectedPtItems.length === 0 ? (
          <Text type="secondary">
            Không có buổi tập với PT nào trong ngày này.
          </Text>
        ) : (
          <ul className="space-y-3">
            {selectedPtItems.map((item) => {
              const ptName =
                item.ptAccount.profile?.name ?? item.ptAccount.email;
              const hasReport = Boolean(item.sessionReport);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setPtDetail(item)}
                    className="flex w-full flex-col gap-2 rounded-sm border border-neutral-200 bg-neutral-50/80 px-4 py-3 text-left transition hover:border-violet-300 hover:bg-violet-50/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-neutral-900">
                        {ptName}
                      </div>
                      <div className="text-sm text-neutral-600">
                        {formatPtRange(item.startTime, item.endTime)} ·{' '}
                        {item.branch.name}
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {item.userPackage.package.name}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Tag color={ptStatusColor(item.status)}>
                        {ptStatusLabel(item.status)}
                      </Tag>
                      {hasReport ? (
                        <Tag color="blue">Có nhận xét từ PT</Tag>
                      ) : (
                        <Tag>Chưa có nhận xét</Tag>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 pt-8 md:pt-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <Title level={2} className="mb-2! text-neutral-900!">
            Lịch tập & check-in
          </Title>
          <Text type="secondary" className="text-base">
            Xem lịch sử check-in tại phòng gym và lịch sử tập cùng huấn luyện
            viên.
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'checkin' | 'pt')}
          items={[
            {
              key: 'checkin',
              label: 'Lịch sử check-in',
              children: checkInTabContent,
            },
            {
              key: 'pt',
              label: 'Lịch sử tập với PT',
              children: ptTabContent,
            },
          ]}
        />

        <style jsx global>{`
          .my-schedule-fullcalendar .fc .fc-toolbar-title {
            font-size: 1rem;
            font-weight: 600;
          }
          .my-schedule-fullcalendar .fc .fc-button {
            border-radius: 6px;
          }
          .my-schedule-fullcalendar .fc .selected-day-cell {
            background-color: rgba(16, 185, 129, 0.06);
            box-shadow: inset 0 0 0 2px rgba(16, 185, 129, 0.45);
          }
          .my-schedule-fullcalendar .fc .selected-day-cell-pt {
            background-color: rgba(139, 92, 246, 0.08);
            box-shadow: inset 0 0 0 2px rgba(139, 92, 246, 0.45);
          }
          .my-schedule-fullcalendar .fc .my-checkin-event {
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.35);
            color: #065f46;
            font-weight: 600;
          }
          .my-schedule-fullcalendar .fc .my-pt-training-event {
            background: rgba(139, 92, 246, 0.12);
            border: 1px solid rgba(139, 92, 246, 0.35);
            color: #5b21b6;
            font-weight: 600;
          }
        `}</style>
      </div>

      <Modal
        title="Chi tiết buổi tập với PT"
        open={ptDetail !== null}
        onCancel={() => setPtDetail(null)}
        footer={null}
        width={640}
        destroyOnClose
      >
        {ptDetail ? (
          <div className="space-y-6">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Huấn luyện viên">
                {ptDetail.ptAccount.profile?.name ?? ptDetail.ptAccount.email}
              </Descriptions.Item>
              <Descriptions.Item label="Email PT">
                {ptDetail.ptAccount.email}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {formatPtRange(ptDetail.startTime, ptDetail.endTime)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={ptStatusColor(ptDetail.status)}>
                  {ptStatusLabel(ptDetail.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chi nhánh">
                {ptDetail.branch.name}
              </Descriptions.Item>
              <Descriptions.Item label="Gói tập">
                {ptDetail.userPackage.package.name}
              </Descriptions.Item>
              {ptDetail.note ? (
                <Descriptions.Item label="Ghi chú">
                  {ptDetail.note}
                </Descriptions.Item>
              ) : null}
              {ptDetail.rejectReason ? (
                <Descriptions.Item label="Lý do từ chối">
                  {ptDetail.rejectReason}
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <div>
              <Title level={5} className="mb-2! mt-0! text-neutral-900!">
                Nhận xét từ PT
              </Title>
              {!ptDetail.sessionReport ? (
                <Text type="secondary">
                  PT chưa gửi nhận xét cho buổi tập này.
                </Text>
              ) : (
                <Descriptions bordered size="small" column={1}>
                  <Descriptions.Item label="Hoàn thành buổi">
                    {ptDetail.sessionReport.completion === 'COMPLETED'
                      ? 'Hoàn thành'
                      : 'Chưa hoàn thành'}
                  </Descriptions.Item>
                  {ptDetail.sessionReport.summary ? (
                    <Descriptions.Item label="Tóm tắt">
                      {ptDetail.sessionReport.summary}
                    </Descriptions.Item>
                  ) : null}
                  {ptDetail.sessionReport.techniqueNote ? (
                    <Descriptions.Item label="Kỹ thuật">
                      {ptDetail.sessionReport.techniqueNote}
                    </Descriptions.Item>
                  ) : null}
                  {ptDetail.sessionReport.improvement ? (
                    <Descriptions.Item label="Cần cải thiện">
                      {ptDetail.sessionReport.improvement}
                    </Descriptions.Item>
                  ) : null}
                  {ptDetail.sessionReport.nextSessionPlan ? (
                    <Descriptions.Item label="Kế hoạch buổi sau">
                      {ptDetail.sessionReport.nextSessionPlan}
                    </Descriptions.Item>
                  ) : null}
                  {ptDetail.sessionReport.weightKg != null ? (
                    <Descriptions.Item label="Cân nặng (kg)">
                      {ptDetail.sessionReport.weightKg}
                    </Descriptions.Item>
                  ) : null}
                  {ptDetail.sessionReport.bodyNote ? (
                    <Descriptions.Item label="Ghi chú cơ thể">
                      {ptDetail.sessionReport.bodyNote}
                    </Descriptions.Item>
                  ) : null}
                </Descriptions>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
