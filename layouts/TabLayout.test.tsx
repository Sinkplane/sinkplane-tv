import { Platform } from 'react-native';
import { render, screen } from '@testing-library/react-native';

import { TabLayout } from '@/layouts/TabLayout';

interface MockSession {
  token: string | null;
  tokenExpiration: string | null;
}

const mockSession = jest.fn<MockSession, []>(() => ({ token: 'token', tokenExpiration: null }));
const mockDelivery = jest.fn<unknown, []>();

jest.mock('@sinkplane/shared', () => ({
  useSession: () => mockSession(),
  useGetVideoDelivery: () => ({ data: mockDelivery() }),
}));
jest.mock('expo-router/unstable-native-tabs', () =>
  jest.requireActual<object>('@/__tests__/unit/doubles/native-tabs'),
);
jest.mock('@/components/ProfileAvatar', () =>
  jest.requireActual<object>('@/__tests__/unit/doubles/labelled-components'),
);
jest.mock('@/layouts/TabLayout.web', () =>
  jest.requireActual<object>('@/__tests__/unit/doubles/labelled-components'),
);

describe('TabLayout', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders native Home and History tabs with the profile avatar on Apple TV', async () => {
    mockDelivery.mockReturnValue(undefined);
    await render(<TabLayout />);

    expect(screen.getByText('Home')).toBeOnTheScreen();
    expect(screen.getByText('History')).toBeOnTheScreen();
    expect(screen.queryByText('Live Now')).not.toBeOnTheScreen();
    expect(screen.getByText('profile avatar')).toBeOnTheScreen();
  });

  it('adds the Live Now tab while the livestream has a delivery', async () => {
    mockDelivery.mockReturnValue({ groups: [] });
    await render(<TabLayout />);

    expect(screen.getByText('Live Now')).toBeOnTheScreen();
  });

  it('uses the JS tab layout on Android TV', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'isTV', 'get').mockReturnValue(true);
    await render(<TabLayout />);

    expect(screen.getByText('js tab layout')).toBeOnTheScreen();
    expect(screen.queryByText('Home')).not.toBeOnTheScreen();
  });

  it('keeps native tabs on Android phones before the session loads', async () => {
    mockSession.mockReturnValueOnce({ token: null, tokenExpiration: null });
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'isTV', 'get').mockReturnValue(false);
    mockDelivery.mockReturnValue(undefined);
    await render(<TabLayout />);

    expect(screen.getByText('Home')).toBeOnTheScreen();
  });
});
