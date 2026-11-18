import { render, screen, userEvent } from '@testing-library/react-native';

import {
  fixtureSubscriptions,
  fixtureUser,
  gamingCreator,
  techCreator,
} from '@/__tests__/e2e/helpers/fixture-world';
import { sessionDouble, themeDouble } from '@/__tests__/unit/doubles/sinkplane-shared';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ProfileMenu } from '@/components/profile-menu/ProfileMenu';

const mockReplace = jest.fn();

jest.mock('@sinkplane/shared', () =>
  jest.requireActual<object>('@/__tests__/unit/doubles/sinkplane-shared'),
);
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const techSubscription = fixtureSubscriptions.filter((sub) => sub.creator === techCreator.id);

describe('ProfileMenu', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    sessionDouble.current = {};
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows only theme and logout entries before creators load', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<ProfileMenu onClose={onClose} />);

    expect(screen.queryByText('Tech Channel')).not.toBeOnTheScreen();
    await user.press(screen.getByText('Dark Mode'));

    expect(themeDouble.toggleColorScheme).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('switches only to creators the user is subscribed to', async () => {
    const setCreator = jest.fn();
    const setSubscription = jest.fn();
    const onClose = jest.fn();
    sessionDouble.current = {
      creators: [techCreator, gamingCreator],
      creator: techCreator,
      subscriptions: techSubscription,
      setCreator,
      setSubscription,
    };
    await render(<ProfileMenu onClose={onClose} />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.press(screen.getByText('Gaming Channel'));
    expect(setCreator).not.toHaveBeenCalled();

    await user.press(screen.getByText('Tech Channel'));
    expect(setSubscription).toHaveBeenCalledWith(techSubscription[0]);
    expect(setCreator).toHaveBeenCalledWith(techCreator);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps the current creator while subscriptions are still loading', async () => {
    const setCreator = jest.fn();
    sessionDouble.current = { creators: [techCreator], setCreator };
    await render(<ProfileMenu onClose={jest.fn()} />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.press(screen.getByText('Tech Channel'));

    expect(setCreator).not.toHaveBeenCalled();
  });

  it('signs out and returns to sign-in', async () => {
    const signOut = jest.fn();
    const onClose = jest.fn();
    sessionDouble.current = { signOut };
    await render(<ProfileMenu onClose={onClose} />);

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await user.press(screen.getByText('Logout'));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith('/sign-in');
  });
});

describe('ProfileAvatar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens the profile menu from the avatar', async () => {
    sessionDouble.current = { user: fixtureUser };
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<ProfileAvatar />);

    expect(screen.queryByText('Switch Subscription')).not.toBeOnTheScreen();
    await user.press(screen.getByTestId('profile-avatar-button'));

    expect(screen.getByText('Switch Subscription')).toBeOnTheScreen();
  });
});
