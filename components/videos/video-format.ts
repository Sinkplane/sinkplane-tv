const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const THOUSAND = 1000;
const MILLION = 1_000_000;
const CLOCK_DIGITS = 2;
const COMPACT_DECIMALS = 1;

const twoDigits = (value: number): string => String(value).padStart(CLOCK_DIGITS, '0');

export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const seconds = Math.floor(totalSeconds % SECONDS_PER_MINUTE);
  if (hours > 0) {
    return `${String(hours)}:${twoDigits(minutes)}:${twoDigits(seconds)}`;
  }
  return `${String(minutes)}:${twoDigits(seconds)}`;
}

export function formatLikes(count: number): string {
  if (count >= MILLION) {
    return `${(count / MILLION).toFixed(COMPACT_DECIMALS)}M`;
  }
  if (count >= THOUSAND) {
    return `${(count / THOUSAND).toFixed(COMPACT_DECIMALS)}K`;
  }
  return String(count);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^<>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

export function watchedFraction(progress: number, duration: number): number {
  return duration > 0 ? Math.min(progress / duration, 1) : 0;
}
