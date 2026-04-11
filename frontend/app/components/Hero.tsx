import Image from "next/image";
import Link from "next/link";
import { Button } from "antd";
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
} from "@ant-design/icons";

const stats = [
  { value: "5+", label: "Years of Service" },
  { value: "10+", label: "Certified Trainers" },
  { value: "786+", label: "Happy Members" },
  { value: "95%", label: "Customer Satisfaction" },
];

export default function Hero() {
  return (
    <section className="w-full bg-black">
      {/* HERO IMAGE AREA */}
      <div className="relative w-full overflow-hidden">
        {/* background image */}
        <Image
          src="/Hero_Section.png"
          alt="Hero"
          fill
          priority
          className="object-cover"
        />

        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/60" />

        {/* content */}
        <div className="relative mx-auto flex min-h-[560px] w-full max-w-7xl items-center px-6 py-16 md:min-h-[640px] md:px-12">
          <div className="max-w-xl text-white">
            <h1 className="text-5xl font-extrabold leading-[1.05] md:text-6xl">
              Live You Best
              <br />
              Life
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-white/80 md:text-lg">
              At Power World Gyms, we believe that fitness is not just a
              destination; it's a journey towards a healthier
            </p>

            <div className="mt-10 flex items-center gap-6">
              <Button type="default" size="large">
                Get Started
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xl">
              <Link href="#" aria-label="Twitter" className="text-white">
                <TwitterOutlined />
              </Link>
              <Link href="#" aria-label="Facebook" className="text-white">
                <FacebookOutlined />
              </Link>
              <Link href="#" aria-label="Instagram" className="text-white">
                <InstagramOutlined />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="w-full bg-black">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-y-10 px-6 py-12 md:grid-cols-4 md:px-12">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-red-600 md:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm font-medium text-red-600 md:text-base">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
