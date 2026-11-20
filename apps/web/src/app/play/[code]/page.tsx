import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidCode } from '@/realtime/codes';
import { Controller } from '@/components/controller/Controller';

export const metadata: Metadata = { title: 'Play' };

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!isValidCode(code)) notFound();
  return <Controller code={code} />;
}
