'use client';

import {
  getAccountUser,
  getAdminAnalyticsOverview,
  getAdminAnalyticsRevenueByBranch,
  getAdminAnalyticsRevenueByPackage,
  getAdminAnalyticsRevenueTimeseries,
  getAdminOperations,
  getBranches,
  getPackages,
  getPtAccounts,
} from '@/app/services/api';
import {
  KPI_DEF,
  PACKAGE_DONUT_COLORS,
  formatBucket,
  formatPct,
  formatVnd,
  GROUP_BY_LABEL,
  pctColor,
  type GroupBy,
} from '@/app/lib/analyticsLabels';
import type {
  AdminAnalyticsChangeVsPrev,
  AdminAnalyticsMetricKey,
  AdminAnalyticsMetrics,
  AnalyticsRevenueByBranchItem,
  AnalyticsRevenueByPackageItem,
  AnalyticsRevenueTimeseriesItem,
  Branch,
  BranchesResponse,
  Package,
  PackagesResponse,
} from '@/app/types/types';
import type { FILTER_PACKAGE_PROPS, FILTER_PROPS } from '@/app/types/filters';
import { formatNumber } from '@/app/utils/common';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  DatePicker,
  Empty,
  Segmented,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const ALL_BRANCHES = '__all__';

const CHANGE_KEY: Record<
  AdminAnalyticsMetricKey,
  keyof AdminAnalyticsChangeVsPrev
> = {
  grossRevenue: 'grossRevenuePct',
  activeRevenue: 'activeRevenuePct',
  purchasesCount: 'purchasesCountPct',
  newUsers: 'newUsersPct',
  activePackages: 'activePackagesPct',
  checkins: 'checkinsPct',
  ptAcceptedSessions: 'ptAcceptedSessionsPct',
};

function PercentTag({ value }: { value: number | null | undefined }) {
  const color = pctColor(value);
  return (
    <Tag color={color === 'default' ? undefined : color} className="m-0!">
      {formatPct(value)}
    </Tag>
  );
}

function compactVnd(value: number): string {
  if (Math.abs(value) >= 1_000_000_000)
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return formatNumber(value);
}

interface RevenueAreaChartProps {
  data: AnalyticsRevenueTimeseriesItem[];
  groupBy: GroupBy;
}

function RevenueAreaChart({ data, groupBy }: RevenueAreaChartProps) {
  if (!data.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có dữ liệu doanh thu"
      />
    );
  }

  const chartData = data.map((d) => ({
    bucket: formatBucket(d.bucket, groupBy),
    grossRevenue: d.grossRevenue,
    activeRevenue: d.activeRevenue,
    purchasesCount: d.purchasesCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1677ff" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#1677ff" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v) => compactVnd(Number(v))}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) => {
            const num = Number(value);
            if (name === 'purchasesCount')
              return [formatNumber(num), 'Lượt mua'];
            return [
              formatVnd(num),
              name === 'grossRevenue' ? 'Doanh thu gộp' : 'Doanh thu active',
            ];
          }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend
          formatter={(v) => {
            if (v === 'grossRevenue') return 'Doanh thu gộp';
            if (v === 'activeRevenue') return 'Doanh thu active';
            return v;
          }}
        />
        <Area
          type="monotone"
          dataKey="grossRevenue"
          stroke="#1677ff"
          strokeWidth={2}
          fill="url(#colorGross)"
        />
        <Area
          type="monotone"
          dataKey="activeRevenue"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorActive)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BranchRevenueBar({ data }: { data: AnalyticsRevenueByBranchItem[] }) {
  if (!data.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có doanh thu theo chi nhánh"
      />
    );
  }
  const chartData = data.slice(0, 10).map((b) => ({
    name: b.branchName,
    revenue: b.revenue,
    purchasesCount: b.purchasesCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        data={chartData}
        margin={{ top: 8, right: 16, left: 0, bottom: 32 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tickFormatter={(v) => compactVnd(Number(v))}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value, name) => {
            const num = Number(value);
            if (name === 'revenue') return [formatVnd(num), 'Doanh thu'];
            return [formatNumber(num), 'Lượt mua'];
          }}
        />
        <Bar dataKey="revenue" fill="#1677ff" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PackageRevenueDonut({
  data,
}: {
  data: AnalyticsRevenueByPackageItem[];
}) {
  if (!data.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Chưa có doanh thu theo gói"
      />
    );
  }
  const top = data.slice(0, 5);
  const otherTotal = data
    .slice(5)
    .reduce((sum, item) => sum + Number(item.revenue ?? 0), 0);
  const chartData = [
    ...top.map((p) => ({
      name: p.packageName,
      value: Number(p.revenue ?? 0),
    })),
    ...(otherTotal > 0 ? [{ name: 'Khác', value: otherTotal }] : []),
  ];

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {chartData.map((_, idx) => (
              <Cell
                key={`cell-${idx}`}
                fill={PACKAGE_DONUT_COLORS[idx % PACKAGE_DONUT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatVnd(Number(value)), 'Doanh thu']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-1">
        {chartData.map((item, idx) => (
          <div
            key={item.name}
            className="flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    PACKAGE_DONUT_COLORS[idx % PACKAGE_DONUT_COLORS.length],
                }}
              />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="text-neutral-600">
              {formatVnd(item.value)}{' '}
              <span className="text-neutral-400">
                ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [branchId, setBranchId] = useState<string>(ALL_BRANCHES);
  const [packageId, setPackageId] = useState<string | undefined>();
  const [groupBy, setGroupBy] = useState<GroupBy>('day');

  const query = useMemo(
    () => ({
      from: range[0].format('YYYY-MM-DD'),
      to: range[1].format('YYYY-MM-DD'),
      groupBy,
      ...(branchId !== ALL_BRANCHES ? { branchId } : {}),
      ...(packageId ? { packageId } : {}),
    }),
    [range, branchId, packageId, groupBy],
  );

  const { data: branchesRes } = useQuery<BranchesResponse>({
    queryKey: ['dashboard-branches'],
    queryFn: () =>
      getBranches({
        page: 1,
        itemsPerPage: 200,
        search: undefined,
      } as FILTER_PROPS),
  });
  const branches: Branch[] = branchesRes?.data ?? [];

  const { data: packagesRes } = useQuery<PackagesResponse>({
    queryKey: ['dashboard-packages'],
    queryFn: () =>
      getPackages({
        page: 1,
        itemsPerPage: 200,
        unit: undefined,
      } as FILTER_PACKAGE_PROPS),
  });
  const packages: Package[] = packagesRes?.data ?? [];

  const baseFilter: FILTER_PROPS = {
    page: 1,
    itemsPerPage: 1,
    search: undefined,
  };
  const { data: ptRes } = useQuery({
    queryKey: ['dashboard-pt-count'],
    queryFn: () => getPtAccounts(baseFilter),
  });
  const { data: userRes } = useQuery({
    queryKey: ['dashboard-user-count'],
    queryFn: () => getAccountUser(baseFilter),
  });

  const { data: overviewRes, isLoading: loadingOverview } = useQuery({
    queryKey: ['dashboard-overview', query],
    queryFn: () => getAdminAnalyticsOverview(query),
  });

  const { data: timeseriesRes, isLoading: loadingSeries } = useQuery({
    queryKey: ['dashboard-timeseries', query],
    queryFn: () => getAdminAnalyticsRevenueTimeseries(query),
  });

  const { data: byBranchRes, isLoading: loadingBranch } = useQuery({
    queryKey: ['dashboard-branch', query],
    queryFn: () => getAdminAnalyticsRevenueByBranch(query),
  });

  const { data: byPackageRes, isLoading: loadingPackage } = useQuery({
    queryKey: ['dashboard-package', query],
    queryFn: () => getAdminAnalyticsRevenueByPackage(query),
  });

  const { data: opsRes } = useQuery({
    queryKey: ['dashboard-operations', query],
    queryFn: () => getAdminOperations(query),
  });

  const metrics: AdminAnalyticsMetrics | undefined = overviewRes?.data?.metrics;
  const change = overviewRes?.data?.changeVsPreviousPeriod;
  const timeseries: AnalyticsRevenueTimeseriesItem[] =
    timeseriesRes?.data ?? [];
  const byBranch: AnalyticsRevenueByBranchItem[] = byBranchRes?.data ?? [];
  const byPackage: AnalyticsRevenueByPackageItem[] = byPackageRes?.data ?? [];
  const totalPts = ptRes?.meta?.total ?? 0;
  const totalUsers = userRes?.meta?.total ?? 0;
  const ops = opsRes?.data;

  const rangeLabel = `${range[0].format('DD/MM/YYYY')} – ${range[1].format(
    'DD/MM/YYYY',
  )}`;

  const branchFilterLabel =
    branchId === ALL_BRANCHES
      ? 'Tất cả chi nhánh'
      : (branches.find((b) => b.id === branchId)?.name ?? 'Chi nhánh');

  return (
    <div className="space-y-5">
      <Card bordered={false} className="shadow-sm!">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Title level={3} className="mb-1!">
              Admin Dashboard
            </Title>
            <Text type="secondary">
              Thống kê tổng quan · Khoảng: {rangeLabel} · {branchFilterLabel}
            </Text>
          </div>
          <Space wrap>
            <RangePicker
              value={range}
              allowClear={false}
              onChange={(val) => {
                if (val?.[0] && val?.[1]) setRange([val[0], val[1]]);
              }}
              format="DD/MM/YYYY"
            />
            <Select
              style={{ width: 200 }}
              value={branchId}
              onChange={setBranchId}
              options={[
                { value: ALL_BRANCHES, label: 'Tất cả chi nhánh' },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <Select
              allowClear
              placeholder="Lọc gói tập"
              style={{ width: 200 }}
              value={packageId}
              onChange={setPackageId}
              options={packages.map((p) => ({ value: p.id, label: p.name }))}
            />
            <Segmented
              value={groupBy}
              onChange={(v) => setGroupBy(v as GroupBy)}
              options={[
                { label: 'Theo ngày', value: 'day' },
                { label: 'Theo tháng', value: 'month' },
                { label: 'Theo năm', value: 'year' },
              ]}
            />
          </Space>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
        {KPI_DEF.map((kpi) => {
          const value = metrics ? metrics[kpi.key] : null;
          const changeVal =
            change && change[CHANGE_KEY[kpi.key]] !== undefined
              ? change[CHANGE_KEY[kpi.key]]
              : null;
          return (
            <Card
              key={kpi.key}
              bordered={false}
              className={`xl:col-span-3 bg-linear-to-br ${kpi.accent} shadow-sm!`}
            >
              {loadingOverview ? (
                <Skeleton active paragraph={{ rows: 1 }} />
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <Text strong className="text-neutral-700">
                      {kpi.label}
                    </Text>
                    <PercentTag value={changeVal} />
                  </div>
                  <Statistic
                    value={Number(value ?? 0)}
                    formatter={() => kpi.formatter(Number(value ?? 0))}
                    valueStyle={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  />
                  {kpi.hint && (
                    <Text type="secondary" className="text-xs">
                      {kpi.hint}
                    </Text>
                  )}
                </div>
              )}
            </Card>
          );
        })}

        <Card
          bordered={false}
          className="xl:col-span-3 bg-linear-to-br from-slate-50 to-slate-100/60 shadow-sm!"
        >
          <div className="flex items-center justify-between">
            <Text strong className="text-neutral-700">
              Tổng PT
            </Text>
            <Tag color="blue" className="m-0!">
              Hệ thống
            </Tag>
          </div>
          <Statistic
            value={totalPts}
            formatter={(v) => formatNumber(Number(v ?? 0))}
            valueStyle={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}
          />
          <Text type="secondary" className="text-xs">
            Tổng số tài khoản PT
          </Text>
        </Card>

        <Card
          bordered={false}
          className="xl:col-span-3 bg-linear-to-br from-fuchsia-50 to-fuchsia-100/60 shadow-sm!"
        >
          <div className="flex items-center justify-between">
            <Text strong className="text-neutral-700">
              Tổng User
            </Text>
            <Tag color="purple" className="m-0!">
              Hệ thống
            </Tag>
          </div>
          <Statistic
            value={totalUsers}
            formatter={(v) => formatNumber(Number(v ?? 0))}
            valueStyle={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}
          />
          <Text type="secondary" className="text-xs">
            Tổng số tài khoản user
          </Text>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card
          bordered={false}
          className="xl:col-span-8 shadow-sm!"
          title={
            <div className="flex items-center justify-between">
              <span>Doanh thu theo thời gian</span>
              <Text type="secondary" className="text-xs!">
                {GROUP_BY_LABEL[groupBy]}
              </Text>
            </div>
          }
        >
          {loadingSeries ? (
            <Skeleton active />
          ) : (
            <RevenueAreaChart data={timeseries} groupBy={groupBy} />
          )}
        </Card>

        <Card
          bordered={false}
          className="xl:col-span-4 shadow-sm!"
          title="Top gói tập doanh thu"
        >
          {loadingPackage ? (
            <Skeleton active />
          ) : (
            <PackageRevenueDonut data={byPackage} />
          )}
        </Card>

        <Card
          bordered={false}
          className="xl:col-span-12 shadow-sm!"
          title="Top chi nhánh doanh thu"
        >
          {loadingBranch ? (
            <Skeleton active />
          ) : (
            <BranchRevenueBar data={byBranch} />
          )}
        </Card>

        {ops && (
          <Card
            bordered={false}
            className="xl:col-span-12 shadow-sm!"
            title="Vận hành chi tiết"
          >
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Card size="small" bordered={false} className="bg-rose-50">
                <Statistic
                  title="User mới"
                  value={ops.newUsers ?? 0}
                  formatter={(v) => formatNumber(Number(v ?? 0))}
                />
              </Card>
              <Card size="small" bordered={false} className="bg-cyan-50">
                <Statistic
                  title="Gói active"
                  value={ops.activePackages ?? 0}
                  formatter={(v) => formatNumber(Number(v ?? 0))}
                />
              </Card>
              <Card size="small" bordered={false} className="bg-lime-50">
                <Statistic
                  title="Check-in"
                  value={ops.checkins ?? 0}
                  formatter={(v) => formatNumber(Number(v ?? 0))}
                />
              </Card>
              <Card size="small" bordered={false} className="bg-amber-50">
                <Statistic
                  title="Buổi PT đã nhận"
                  value={ops.ptAcceptedSessions ?? 0}
                  formatter={(v) => formatNumber(Number(v ?? 0))}
                />
              </Card>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
