"use client";

import { appRoute } from "@/app/config/appRoute";
import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";

export default function Coaches() {
  return (
    <section className="w-full bg-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-20 md:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Left: Images */}
          <div className="flex items-center gap-8">
            {/* Tall image */}
            <div className="relative h-[420px] w-[260px] overflow-hidden rounded-3xl">
              <Image
                src="/photo4.png"
                alt="Coach photo 4"
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Wide image */}
            <div className="relative h-[420px] w-full max-w-[520px] overflow-hidden rounded-3xl">
              <Image
                src="/photo5.png"
                alt="Coach photo 5"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Right: Content */}
          <div className="max-w-xl">
            <p className="text-2xl text-neutral-400 md:text-3xl">
              Are you looking for a Mentor?
            </p>

            <h2 className="mt-4 text-5xl font-extrabold text-neutral-800 md:text-6xl">
              Coaches
            </h2>

            <p className="mt-6 text-lg leading-8 text-neutral-500">
              stronger version of yourself. We are dedicated to empowering you
              on this transformative journey with our state-of-the-art
              facilities, regardless of your fitness level or goals.
            </p>

            <div className="mt-10">
              <Link href={appRoute.home.coaches}>
                <Button type="primary" size="large">
                  Xem đội ngũ PT
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
