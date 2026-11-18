import { presentOrUndefined } from './session-value';

describe('presentOrUndefined', () => {
  it('turns null into undefined', () => {
    expect(presentOrUndefined<string>(null)).toBeUndefined();
  });

  it('keeps undefined', () => {
    expect(presentOrUndefined<string>(undefined)).toBeUndefined();
  });

  it('keeps a present value', () => {
    expect(presentOrUndefined('token')).toBe('token');
  });
});
