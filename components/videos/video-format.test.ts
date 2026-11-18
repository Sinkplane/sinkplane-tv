import { formatDuration, formatLikes, watchedFraction, stripHtml } from './video-format';

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [59, '0:59'],
    [61, '1:01'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3725, '1:02:05'],
    [3725.9, '1:02:05'],
  ])('formats %p seconds as %p', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected);
  });
});

describe('formatLikes', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.0K'],
    [1250, '1.3K'],
    [999_999, '1000.0K'],
    [1_000_000, '1.0M'],
    [1_500_000, '1.5M'],
  ])('formats %p likes as %p', (count, expected) => {
    expect(formatLikes(count)).toBe(expected);
  });
});

describe('stripHtml', () => {
  it('removes tags, decodes non-breaking spaces, and trims', () => {
    expect(stripHtml('  <p>Hello&nbsp;<b>world</b></p>  ')).toBe('Hello world');
  });

  it('leaves plain text untouched', () => {
    expect(stripHtml('a < b > c')).toBe('a  c');
  });
});

describe('watchedFraction', () => {
  it.each([
    [300, 1200, 0.25],
    [1200, 1200, 1],
    [5000, 1200, 1],
    [0, 1200, 0],
    [100, 0, 0],
  ])('progress %p of %p is %p', (progress, duration, expected) => {
    expect(watchedFraction(progress, duration)).toBe(expected);
  });
});
