import { useState } from 'react';

export type MountCallback = (node: unknown) => () => void;

export function useMountCallback(onMount: () => () => void): MountCallback {
  const [attach] = useState<MountCallback>(() => () => onMount());
  return attach;
}
