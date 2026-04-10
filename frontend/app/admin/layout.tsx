'use client';

import React, { useState } from 'react';
import {
  HomeOutlined,
  DashboardOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  FolderOpenFilled,
  GlobalOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { appRoute } from '../config/appRoute';
import AdminProtectedRoute from '../components/layout/AdminProtectedRoute';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: <Link href="/admin">Thống kê</Link>,
    },
    {
      key: appRoute.admin.users,
      icon: <UserOutlined />,
      label: <Link href={appRoute.admin.users}>Tài khoản học viên</Link>,
    },
    {
      key: appRoute.admin.pt,
      icon: <UserOutlined />,
      label: <Link href={appRoute.admin.pt}>Huấn luyện viên</Link>,
    },
    {
      key: appRoute.admin.package,
      icon: <UploadOutlined />,
      label: <Link href={appRoute.admin.package}>Gói tập</Link>,
    },
    {
      key: appRoute.admin.exercise,
      icon: <VideoCameraOutlined />,
      label: <Link href={appRoute.admin.exercise}>Bài tập mẫu</Link>,
    },
    {
      key: appRoute.admin.program,
      icon: <FolderOpenFilled />,
      label: <Link href={appRoute.admin.program}>Chương trình tập luyện</Link>,
    },
    {
      key: appRoute.admin.branch,
      icon: <GlobalOutlined />,
      label: <Link href={appRoute.admin.branch}>Chi nhánh</Link>,
    },
    {
      key: appRoute.admin.ptKpi,
      icon: <TrophyOutlined />,
      label: <Link href={appRoute.admin.ptKpi}>PT KPI</Link>,
    },
  ];

  return (
    <AdminProtectedRoute>
      <Layout
        style={{
          minHeight: '100vh',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Sider trigger={null} collapsible collapsed={collapsed}>
          <div className="flex h-16 items-center justify-center bg-neutral-800">
            <span className="text-lg font-bold text-white">
              {collapsed ? 'B' : 'BestGym'}
            </span>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            style={{ marginTop: 8 }}
          />
        </Sider>
        <Layout
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Header
            style={{
              padding: '0 12px 0 0',
              background: colorBgContainer,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: '16px',
                  width: 64,
                  height: 64,
                }}
              />
            </div>
            <Link href={appRoute.home.root}>
              <Button icon={<HomeOutlined />}>Về trang chủ</Button>
            </Link>
          </Header>
          <Content
            style={{
              margin: '24px 16px',
              padding: 24,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </AdminProtectedRoute>
  );
}
