import { Platform, useWindowDimensions } from 'react-native';

const TV_DESIGN_WIDTH = 1000;

export function useScale(): number {
  const { width } = useWindowDimensions();
  return Platform.isTV ? width / TV_DESIGN_WIDTH : 1;
}
