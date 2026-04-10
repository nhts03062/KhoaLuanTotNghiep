"use client";
import React from "react";
import Hero from "../components/Hero";
import ChooseUs from "../components/ChooseUs";
import Coaches from "../components/Coaches";
import PricingPlan from "../components/PricingPlan";

function page() {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <PricingPlan />
      <ChooseUs />
      <Coaches />
    </main>
  );
}

export default page;
