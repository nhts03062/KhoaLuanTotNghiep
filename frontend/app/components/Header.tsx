'use client';

import {
  Menu,
  Button,
  Modal,
  Form,
  Input,
  message,
  Dropdown,
  Badge,
  Popover,
  Spin,
} from 'antd';
import type { MenuProps } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import {
  getMe,
  getTodayExercise,
  signUp,
  signin,
  verifyAccount,
} from '../services/api';
import { getApiErrorMessage } from '@/app/lib/apiError';
import { appRoute } from '../config/appRoute';
import type { TodayExcerciseResponse } from '../types/types';

const menuItems = [
  { key: '/', label: <Link href="/">Home</Link> },
  { key: '/about', label: <Link href="/about">About</Link> },
  {
    key: '/packages',
    label: <Link href={appRoute.home.packages}>Packages</Link>,
  },
  { key: '/exercises', label: <Link href="/exercises">Exercises</Link> },
  {
    key: '/coaches',
    label: <Link href={appRoute.home.coaches}>Coaches</Link>,
  },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoggedIn, setAuth, clearAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpStep, setSignUpStep] = useState<'signUp' | 'verifyAccount'>(
    'signUp',
  );
  const [signUpEmail, setSignUpEmail] = useState('');
  const [verificationCodeDraft, setVerificationCodeDraft] = useState('');
  const [signUpForm] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const verificationCodeInputRef = useRef<any>(null);

  const { data: todayExerciseRes, isLoading: isTodayLoading } =
    useQuery<TodayExcerciseResponse>({
      queryKey: ['header-today-exercises'],
      queryFn: () => getTodayExercise(),
      enabled: isLoggedIn && user?.role === 'USER',
    });

  const todayExercises = todayExerciseRes?.data?.exercises ?? [];
  const todayProgramDay = todayExerciseRes?.data?.programDay;

  useEffect(() => {
    if (signUpStep === 'verifyAccount' && signUpEmail) {
      verifyForm.setFieldsValue({ email: signUpEmail });
    }
  }, [signUpStep, signUpEmail, verifyForm]);

  const handleSignIn = () => {
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const { access_token } = await signin(values.email, values.password);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('access_token', access_token);
      }
      const me = await getMe();
      setAuth(access_token, me);
      message.success('Đăng nhập thành công');
      form.resetFields();
      setIsModalOpen(false);
      router.push(appRoute.home.root);
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, 'Email hoặc mật khẩu không đúng'));
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleOpenSignUp = () => {
    setSignUpStep('signUp');
    setSignUpEmail('');
    setVerificationCodeDraft('');
    signUpForm.resetFields();
    verifyForm.resetFields();
    setIsSignUpOpen(true);
  };

  const handleSignUpCancel = () => {
    setIsSignUpOpen(false);
    setSignUpStep('signUp');
    setSignUpEmail('');
    setVerificationCodeDraft('');
    signUpForm.resetFields();
    verifyForm.resetFields();
  };

  const handleSignUpSubmit = async () => {
    try {
      const values = await signUpForm.validateFields();
      setSignUpLoading(true);
      await signUp({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      setSignUpEmail(values.email);
      setVerificationCodeDraft('');
      verifyForm.setFieldsValue({
        email: values.email,
      });
      setSignUpStep('verifyAccount');
      message.success(
        'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.',
      );
    } catch (err: unknown) {
      message.error(
        getApiErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'),
      );
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleVerifyAccountSubmit = async () => {
    try {
      // validate để show error UI, nhưng luôn ưu tiên đọc mã xác thực từ state local
      const values = await verifyForm.validateFields();
      setSignUpLoading(true);
      const email = values.email || signUpEmail;
      const rawCode =
        values.verificationCode ??
        verifyForm.getFieldValue('verificationCode') ??
        verificationCodeDraft ??
        verificationCodeInputRef.current?.value;
      const verificationCode = String(rawCode ?? '').trim();

      if (!email) {
        message.error('Email không hợp lệ');
        return;
      }
      if (!verificationCode) {
        message.error('Vui lòng nhập mã xác thực');
        return;
      }

      await verifyAccount({ email, verificationCode });

      message.success('Xác minh tài khoản thành công');
      handleSignUpCancel();
    } catch (err: unknown) {
      message.error(
        getApiErrorMessage(err, 'Xác minh thất bại. Vui lòng thử lại.'),
      );
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push(appRoute.home.root);
  };

  const userMenuItems: MenuProps['items'] = [
    ...(user?.role === 'USER'
      ? [
          {
            key: 'my-packages',
            label: <Link href="/my-packages">Gói tập đã đăng ký</Link>,
          },
          {
            key: 'my-schedule',
            label: <Link href="/my-schedule">Lịch tập</Link>,
          },
          {
            key: 'my-workout-history',
            label: <Link href="/my-workout-history">Lịch sử tập</Link>,
          },
        ]
      : []),
    ...(user?.role === 'PT'
      ? [
          {
            key: 'pt-students',
            label: <Link href="/pt/trainee">Danh sách học viên</Link>,
          },
          {
            key: 'pt-schedule',
            label: <Link href="/pt/schedule">Lịch dạy</Link>,
          },
          {
            key: 'pt-kpi',
            label: <Link href="/pt/kpi">KPI của tôi</Link>,
          },
          {
            key: 'pt-exercises',
            label: <Link href="/pt/exercises">Bài tập của tôi</Link>,
          },
          {
            key: 'pt-programs',
            label: <Link href="/pt/programs">Chương trình của tôi</Link>,
          },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ key: 'admin', label: <Link href="/admin">Admin page</Link> }]
      : []),
    { key: 'profile', label: <Link href="/profile">Thông tin cá nhân</Link> },
    { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-black px-6 md:px-10 shadow-md">
      <div className="mx-auto flex min-h-[88px] w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={150}
            height={52}
            priority
            className="object-contain"
          />
        </Link>

        <div className="hidden flex-1 justify-center sm:flex">
          <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            theme="dark"
            disabledOverflow
            style={{ background: 'transparent', borderBottom: 'none' }}
          />
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-3">
            {user?.role === 'USER' ? (
              <Popover
                trigger="click"
                placement="bottomRight"
                content={
                  <div className="w-80">
                    <div className="mb-2 text-sm font-semibold">
                      Lịch tập hôm nay
                    </div>
                    {isTodayLoading ? (
                      <div className="py-3 text-center">
                        <Spin size="small" />
                      </div>
                    ) : !todayProgramDay || todayExercises.length === 0 ? (
                      <p className="text-sm text-neutral-500">
                        Hôm nay bạn chưa có bài tập.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
                          <p className="text-sm font-semibold text-neutral-900">
                            {todayProgramDay.title}
                          </p>
                          {todayProgramDay.note ? (
                            <p className="mt-0.5 text-xs text-neutral-600">
                              {todayProgramDay.note}
                            </p>
                          ) : null}
                        </div>
                        {todayExercises.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5"
                          >
                            <p className="text-sm font-medium text-neutral-900">
                              {item.sortOrder}. {item.exercise.name}
                            </p>
                            <p className="text-xs text-neutral-600">
                              {item.exercise.muscleGroup} ·{' '}
                              {item.exercise.level}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                }
              >
                <button
                  type="button"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10 hover:text-white"
                >
                  <Badge
                    count={todayExercises.length}
                    size="small"
                    offset={[-1, 2]}
                  >
                    <BellOutlined className="text-lg text-white!" />
                  </Badge>
                </button>
              </Popover>
            ) : null}

            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={['hover']}
              placement="bottomRight"
            >
              <span className="flex cursor-pointer items-center gap-2 text-white hover:underline">
                <UserOutlined className="text-base" />
                {user?.email}
              </span>
            </Dropdown>
          </div>
        ) : (
          <>
            <Button
              type="primary"
              shape="square"
              size="large"
              onClick={handleSignIn}
              className="header-login-btn"
            >
              Sign in
            </Button>
            <Button
              type="primary"
              shape="square"
              size="large"
              onClick={handleOpenSignUp}
            >
              Sign up
            </Button>
          </>
        )}
      </div>

      <Modal
        title="Sign in"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        okText="Đăng nhập"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input type="email" placeholder="example@email.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={signUpStep === 'signUp' ? 'Sign up' : 'Verify account'}
        open={isSignUpOpen}
        onCancel={handleSignUpCancel}
        footer={null}
        confirmLoading={signUpLoading}
        destroyOnClose
      >
        {signUpStep === 'signUp' ? (
          <Form form={signUpForm} layout="vertical" className="mt-4">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                type="email"
                placeholder="example@email.com"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' },
              ]}
            >
              <Input.Password placeholder="••••••••" size="large" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Nhập lại mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('Mật khẩu nhập lại không khớp'),
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="••••••••" size="large" />
            </Form.Item>

            <div className="flex justify-end gap-3">
              <Button onClick={handleSignUpCancel}>Hủy</Button>
              <Button
                type="primary"
                onClick={handleSignUpSubmit}
                loading={signUpLoading}
              >
                Đăng ký
              </Button>
            </div>
          </Form>
        ) : (
          <Form form={verifyForm} layout="vertical" className="mt-4">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Email không được để trống' }]}
            >
              <Input readOnly />
            </Form.Item>

            <Form.Item
              name="verificationCode"
              label="Mã xác thực"
              rules={[{ required: true, message: 'Vui lòng nhập mã xác thực' }]}
            >
              <Input
                placeholder="Nhập mã từ email"
                size="large"
                onChange={(e) => {
                  setVerificationCodeDraft(e.target.value);
                  verifyForm.setFieldsValue({
                    verificationCode: e.target.value,
                  });
                }}
                ref={verificationCodeInputRef}
              />
            </Form.Item>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setSignUpStep('signUp');
                  verifyForm.resetFields();
                  signUpForm.setFieldsValue({ email: signUpEmail });
                }}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                onClick={handleVerifyAccountSubmit}
                loading={signUpLoading}
              >
                Xác minh
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </header>
  );
}
