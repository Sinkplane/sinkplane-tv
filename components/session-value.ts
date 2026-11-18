export function presentOrUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
