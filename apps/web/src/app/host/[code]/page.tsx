import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidCode } from '@/realtime/codes';
import { Stage } from '@/components/stage/Stage';

export const metadata: Metadata = { title: 'Stage | iatrome' };

export default async function StagePage({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!isValidCode(code)) notFound();
  return <Stage code={code} />;
}
