import type { Metadata } from 'next';
import { HostSetup } from '@/components/home/HostSetup';

export const metadata: Metadata = { title: 'Host a game' };

export default function HostPage() {
  return <HostSetup />;
}
