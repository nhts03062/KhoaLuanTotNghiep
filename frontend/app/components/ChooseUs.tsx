"use client";

import Image from "next/image";
import {
  EllipsisOutlined,
  SmileOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";

export default function ChooseUs() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16 md:px-12">
        {/* Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-extrabold text-neutral-800 md:text-5xl">
            Why Choose Us
          </h2>
          <p className="mt-6 text-lg leading-8 text-neutral-500">
            Exercise is defined as any physical activity that makes your muscles
            work and requires your body to burn calories.
          </p>
        </div>

        {/* Content */}
        <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left: Features */}
          <div className="space-y-14">
            {/* 1 */}
            <div className="flex items-start gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-800">
                <EllipsisOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800">
                  Improved Physical Health
                </h3>
                <p className="mt-3 max-w-md text-base leading-7 text-neutral-500">
                  Regular exercise can lead to enhanced cardiovascular health,
                  stronger muscles and bones, improved flexibility, and
                  increased endurance.
                </p>
              </div>
            </div>

            {/* 2 */}
            <div className="flex items-start gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-800">
                <SmileOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800">
                  Enhanced Mental Health
                </h3>
                <p className="mt-3 max-w-md text-base leading-7 text-neutral-500">
                  Exercise releases endorphins, often referred to as the
                  ‘feel-good’ hormones, which can elevate mood and reduce
                  feelings of stress,
                </p>
              </div>
            </div>

            {/* 3 */}
            <div className="flex items-start gap-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-neutral-800">
                <ThunderboltOutlined className="text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-800">
                  Increased Energy Levels
                </h3>
                <p className="mt-3 max-w-md text-base leading-7 text-neutral-500">
                  Regular physical activity improves blood circulation and
                  oxygen delivery to the body, resulting in increased energy
                  levels and reduced fatigue
                </p>
              </div>
            </div>
          </div>

          {/* Right: Images collage */}
          <div className="mx-auto w-full max-w-xl">
            <div className="grid grid-cols-2 gap-6">
              {/* Left column: 2 stacked images */}
              <div className="flex flex-col gap-6">
                <div className="relative h-44 overflow-hidden rounded-2xl md:h-52">
                  <Image
                    src="/photo1.png"
                    alt="Photo 1"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative h-44 overflow-hidden rounded-2xl md:h-52">
                  <Image
                    src="/photo2.png"
                    alt="Photo 2"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Right column: tall image */}
              <div className="relative h-[368px] overflow-hidden rounded-2xl md:h-[436px]">
                <Image
                  src="/photo3.avif"
                  alt="Photo 3"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
