'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Typography } from 'antd';
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Contact', href: '/contact' },
];

const branches = ['Galle', 'Kurunduwattha', 'Kottawa', 'Mathara'];

const col3 = ['Lorem', 'Lorem', 'Lorem', 'Lorem'];
const col4 = ['Lorem', 'Lorem', 'Lorem', 'Lorem'];

export default function Footer() {
  return (
    <footer className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-14 md:px-12">
        {/* Top grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* Left block */}
          <div className="md:col-span-4">
            <div className="flex items-start gap-4">
              <Image
                src="/Logo.png"
                alt="Logo"
                width={70}
                height={70}
                className="h-auto w-[70px] object-contain"
              />
            </div>

            <div className="mt-6 space-y-4">
              <Text className="block text-base text-neutral-700">
                © 2025 by Chamith Fitness Gyms
              </Text>

              <Text className="block text-base text-neutral-700">
                chamithfitness@gmail.com
              </Text>

              <div className="flex items-center gap-6 text-xl text-neutral-700">
                <Link href="#" aria-label="Facebook">
                  <FacebookOutlined />
                </Link>
                <Link href="#" aria-label="Twitter">
                  <TwitterOutlined />
                </Link>
                <Link href="#" aria-label="Instagram">
                  <InstagramOutlined />
                </Link>
              </div>
            </div>
          </div>

          {/* Columns */}
          <div className="md:col-span-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4">
              {/* Col 1 */}
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Quick Links
                </Title>
                <div className="mt-6 flex flex-col gap-3">
                  {quickLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-base text-neutral-600"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Col 2 */}
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Branches
                </Title>
                <div className="mt-6 flex flex-col gap-3">
                  {branches.map((b) => (
                    <Text key={b} className="text-base text-neutral-600">
                      {b}
                    </Text>
                  ))}
                </div>
              </div>

              {/* Col 3 */}
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Lorem Ipsum
                </Title>
                <div className="mt-6 flex flex-col gap-3">
                  {col3.map((t, idx) => (
                    <Text key={idx} className="text-base text-neutral-600">
                      {t}
                    </Text>
                  ))}
                </div>
              </div>

              {/* Col 4 */}
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Lorem Ipsum
                </Title>
                <div className="mt-6 flex flex-col gap-3">
                  {col4.map((t, idx) => (
                    <Text key={idx} className="text-base text-neutral-600">
                      {t}
                    </Text>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div className="mt-14 text-center">
          <Text className="text-base text-neutral-700">
            © 2025 by Chamith Fitness Gyms. All rights reserved. Powered and
            secured by Orionwave-Team
          </Text>
        </div>
      </div>
    </footer>
  );
}
