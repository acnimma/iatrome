import { notFound, redirect } from 'next/navigation';
import { isValidCode } from '@/realtime/codes';

/** Short links: iatrome.com/ABCDEF → the join screen for that room. */
export default async function ShortLink({ params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase();
  if (!isValidCode(code)) notFound();
  redirect(`/play/${code}`);
}
