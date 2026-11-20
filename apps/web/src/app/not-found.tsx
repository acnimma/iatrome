import type { Metadata } from 'next';
import { EdgePage } from '@/components/home/EdgePage';

export const metadata: Metadata = { title: 'Not found' };

/** Unknown pages and short links that aren't room codes (like /hello1). */
export default function NotFound() {
  return (
    <EdgePage
      eyebrow="404"
      title="Nothing on this chart"
      line="I checked twice. There’s no page here. If someone gave you a room code, it’s six letters, no numbers: type it below."
      joinForm
    />
  );
}
