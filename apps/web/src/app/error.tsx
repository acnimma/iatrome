'use client';

import { useEffect } from 'react';
import { EdgePage } from '@/components/home/EdgePage';
import { Button } from '@/components/ui/Button';

/** Something threw. Beep's rate goes up; the page offers a retry and a way home. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <EdgePage
      eyebrow="Unexpected finding"
      title="Well, that’s not normal"
      line="This page fell over. Not your fault, probably. Try again, and if it keeps happening, the room code still works from the home page."
      bpm={128}
      action={
        <Button size="lg" block onClick={reset}>
          Try again
        </Button>
      }
    />
  );
}
