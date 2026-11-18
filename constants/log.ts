export function logError(context: string, error: unknown): void {
  // eslint-disable-next-line no-console -- the app's single error sink; Metro and device logs read console.error
  console.error(context, error);
}
