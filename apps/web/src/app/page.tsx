'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { NetworksShowcase } from '@/components/NetworksShowcase';
import { HowItWorks } from '@/components/HowItWorks';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-surface-950 bg-grid">
      <Nav />
      <Hero />
      <NetworksShowcase />
      <HowItWorks />
      <CTA />
      <Footer />
    </main>
  );
}
