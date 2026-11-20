'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/icons/Icon';
import { haptic } from '@/lib/haptics';
import { play } from '@/lib/sound';

/**
 * Share the room's join link: the native share sheet on phones, otherwise copy to
 * the clipboard (handy for pasting into a video call's chat).
 */
export function InviteButton({ code, tone = 'card' }: { code: string; tone?: 'card' | 'gold' }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === 'undefined' ? '' : `${window.location.origin}/${code}`;

  const invite = async () => {
    const touch = window.matchMedia('(pointer: coarse)').matches;
    if (touch && navigator.share) {
      try {
        await navigator.share({ title: 'Join my iatrome game', text: `Room ${code}`, url });
        return;
      } catch {
        // dismissed the sheet: fall through to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      haptic('success');
      play('correct');
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', url);
    }
  };

  return (
    <Button tone={tone} onClick={invite} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={copied ? 'copied' : 'invite'}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Icon name={copied ? 'check' : 'sparkles'} size={22} />
          {copied ? 'Link copied!' : 'Invite link'}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
