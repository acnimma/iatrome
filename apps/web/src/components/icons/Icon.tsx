import { ICONS, type IconName } from './icons';

/** A brand icon. Decorative by default; pass `label` to make it meaningful to screen readers. */
export function Icon({ name, size = 48, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      focusable="false"
      style={{ display: 'inline-block', flex: 'none', verticalAlign: 'middle' }}
      {...a11y}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
