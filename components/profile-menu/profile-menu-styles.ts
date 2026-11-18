import { StyleSheet } from 'react-native';
import { useThemeColor } from '@sinkplane/shared';

import { BORDER_WIDTH, FONT_SIZE, ICON_SIZE, RADIUS, SPACE } from '@/constants/layout';
import { useScale } from '@/hooks/useScale';

const MENU_TOP = 80;
const MENU_MIN_WIDTH = 300;
const DIVIDER_ALPHA = '40';
const LOGOUT_COLOR = '#d32f2f';
const CREATOR_ICON_RADIUS = 15;

export const staticMenuStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menu: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuTitle: { fontWeight: 'bold' },
  creatorItem: { flexDirection: 'row', alignItems: 'center' },
  activeMenuItemText: { fontWeight: 'bold' },
  menuItemTextNormal: { fontWeight: '400' },
  menuItemLogoutText: { color: LOGOUT_COLOR, fontWeight: '600' },
});

interface MenuColors {
  readonly tint: string;
  readonly background: string;
  readonly text: string;
  readonly icon: string;
}

function createProfileMenuStyles(scale: number, { tint, background, text, icon }: MenuColors) {
  return StyleSheet.create({
    modalOverlay: { paddingTop: MENU_TOP * scale, paddingLeft: SPACE.xl * scale },
    menu: {
      backgroundColor: background,
      borderRadius: RADIUS.lg * scale,
      padding: SPACE.lg * scale,
      minWidth: MENU_MIN_WIDTH * scale,
    },
    menuTitle: {
      fontSize: FONT_SIZE.large * scale,
      marginBottom: SPACE.md * scale,
      color: text,
      paddingHorizontal: SPACE.sm * scale,
    },
    creatorItem: { gap: SPACE.md * scale },
    creatorIcon: {
      width: ICON_SIZE.xl * scale,
      height: ICON_SIZE.xl * scale,
      borderRadius: CREATOR_ICON_RADIUS * scale,
    },
    activeMenuItem: { borderLeftWidth: BORDER_WIDTH.accent * scale, borderLeftColor: tint },
    divider: {
      height: scale,
      backgroundColor: `${icon}${DIVIDER_ALPHA}`,
      marginVertical: SPACE.sm * scale,
    },
    menuItem: {
      paddingVertical: SPACE.md * scale,
      paddingHorizontal: SPACE.sm * scale,
      borderRadius: RADIUS.md * scale,
    },
    menuItemText: { fontSize: FONT_SIZE.body * scale, color: text },
  });
}

export type ProfileMenuStyles = ReturnType<typeof createProfileMenuStyles>;

export function useProfileMenuStyles(): ProfileMenuStyles {
  const scale = useScale();
  const colors = {
    tint: useThemeColor({}, 'tint'),
    background: useThemeColor({}, 'background'),
    text: useThemeColor({}, 'text'),
    icon: useThemeColor({}, 'icon'),
  };
  return createProfileMenuStyles(scale, colors);
}
