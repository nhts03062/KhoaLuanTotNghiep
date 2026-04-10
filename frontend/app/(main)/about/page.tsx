'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import {
  AimOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  CoffeeOutlined,
  SkinOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';

type ArticleItem = {
  key: string;
  title: string;
  eyebrow: string;
  description: string;
  bullets: string[];
  icon: ReactNode;
  imageSrc: string;
  imageAlt: string;
};

const articles: ArticleItem[] = [
  {
    key: 'gym-access',
    eyebrow: 'Không gian tập',
    title: 'Truy cập toàn bộ phòng gym',
    description:
      'Hội viên có thể sử dụng đầy đủ khu vực cardio, tạ tự do, functional training và recovery trong giờ hoạt động.',
    bullets: [
      'Không gian rộng rãi, bố trí thông thoáng và dễ di chuyển',
      'Khu tập đa dạng cho mục tiêu giảm cân, tăng cơ và nâng cao sức bền',
      'Quy trình vệ sinh và bảo trì được thực hiện thường xuyên',
    ],
    icon: <AimOutlined />,
    imageSrc:
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Không gian phòng gym rộng rãi với máy tập và tạ',
  },
  {
    key: 'modern-equipment',
    eyebrow: 'Trang thiết bị',
    title: 'Thiết bị tập luyện hiện đại',
    description:
      'Hệ thống máy tập được lựa chọn theo tiêu chí an toàn, dễ sử dụng và phù hợp với nhiều cấp độ hội viên.',
    bullets: [
      'Máy cardio, tạ tự do và thiết bị hỗ trợ tập chuyên biệt',
      'Bổ sung dụng cụ cho bài tập core, mobility và functional',
      'Bảo trì định kỳ để đảm bảo trải nghiệm tập luyện ổn định',
    ],
    icon: <AppstoreOutlined />,
    imageSrc:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Khu vực tạ và máy tập hiện đại trong phòng gym',
  },
  {
    key: 'locker-room',
    eyebrow: 'Tiện ích',
    title: 'Phòng thay đồ và tủ đồ tiện nghi',
    description:
      'Khu thay đồ được thiết kế riêng tư, gọn gàng và hỗ trợ hội viên trước, trong và sau buổi tập.',
    bullets: [
      'Tủ đồ gọn gàng để bảo quản vật dụng cá nhân',
      'Không gian thay đồ sạch sẽ, dễ sử dụng',
      'Tăng trải nghiệm tập luyện liền mạch và thuận tiện hơn',
    ],
    icon: <SkinOutlined />,
    imageSrc:
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Không gian spa và tiện ích thư giãn sau buổi tập',
  },
  {
    key: 'personal-training',
    eyebrow: 'Hỗ trợ 1-1',
    title: 'Hướng dẫn bởi huấn luyện viên cá nhân',
    description:
      'Gói có PT giúp bạn có lộ trình rõ ràng hơn, được theo dõi kỹ thuật và điều chỉnh bài tập sát với mục tiêu.',
    bullets: [
      'Đồng hành bởi đội ngũ PT có chuyên môn',
      'Hỗ trợ điều chỉnh bài tập theo thể trạng và tiến độ',
      'Tối ưu hiệu quả tập luyện và giảm nguy cơ sai kỹ thuật',
    ],
    icon: <UsergroupAddOutlined />,
    imageSrc:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Huấn luyện viên hướng dẫn hội viên tập luyện',
  },
  {
    key: 'nutrition-support',
    eyebrow: 'Dinh dưỡng',
    title: 'Hỗ trợ tư vấn dinh dưỡng',
    description:
      'Bên cạnh lịch tập, bạn có thêm định hướng để cân bằng chế độ ăn và phục hồi tốt hơn.',
    bullets: [
      'Gợi ý thói quen ăn uống phù hợp với mục tiêu',
      'Đồng bộ giữa tập luyện, nghỉ ngơi và phục hồi',
      'Dễ dàng xây dựng nền tảng sức khỏe bền vững',
    ],
    icon: <CoffeeOutlined />,
    imageSrc:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1400&q=80&auto=format&fit=crop',
    imageAlt: 'Bữa ăn lành mạnh hỗ trợ dinh dưỡng và phục hồi',
  },
];

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1600&q=80&auto=format&fit=crop';

function ArticleCard({ item }: { item: ArticleItem }) {
  return (
    <article
      id={item.key}
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm transition-colors"
    >
      <div className="grid gap-8 p-8 lg:grid-cols-2 lg:items-start">
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-neutral-100">
          <Image
            src={item.imageSrc}
            alt={item.imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>

        <div>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
                {item.eyebrow}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-neutral-900 md:text-3xl">
                {item.title}
              </h2>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-2xl text-white">
              {item.icon}
            </div>
          </div>

          <p className="max-w-3xl text-base leading-7 text-neutral-600">
            {item.description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {item.bullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4"
              >
                <div className="flex items-start gap-3">
                  <ArrowRightOutlined className="mt-1 shrink-0 text-xs text-neutral-500" />
                  <p className="text-sm leading-6 text-neutral-700">{bullet}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AboutPage() {
  const searchParams = useSearchParams();
  const activeArticle = searchParams.get('article');

  const currentArticle = useMemo(
    () => articles.find((item) => item.key === activeArticle) ?? articles[0],
    [activeArticle],
  );

  useEffect(() => {
    if (!activeArticle) return;

    const id = window.setTimeout(() => {
      const el = document.getElementById(activeArticle);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    return () => window.clearTimeout(id);
  }, [activeArticle]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f7f7_55%,#efefef_100%)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:px-12 md:py-20 lg:grid-cols-2 lg:items-center">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
              Giới thiệu PowerFit
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-neutral-900 md:text-5xl lg:text-6xl">
              Không chỉ là gói tập — đây là toàn bộ trải nghiệm tập luyện.
            </h1>
            <p className="mt-6 text-base leading-8 text-neutral-600 md:text-lg">
              Khám phá các tiện ích, dịch vụ và không gian tập luyện được thiết kế để
              giúp bạn tập hiệu quả hơn, thoải mái hơn và bền vững hơn.
            </p>
          </div>

          <div className="relative aspect-4/3 w-full max-w-xl justify-self-end overflow-hidden rounded-3xl border border-neutral-200 shadow-lg lg:max-w-none">
            <Image
              src={HERO_IMAGE}
              alt="Không gian phòng gym PowerFit với thiết bị hiện đại"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-2">
            {articles.map((item) => {
              const isActive = item.key === currentArticle.key;
              return (
                <a
                  key={item.key}
                  href={`?article=${item.key}`}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  {item.title}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-12">
        <div className="grid gap-6">
          {articles.map((item) => (
            <ArticleCard key={item.key} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
