import { render, screen, userEvent } from '@testing-library/react-native';
import type { OIDCStatus } from '@sinkplane/shared';

import { SignInInstructions } from '@/components/sign-in/SignInInstructions';
import type { DeviceSignInState } from '@/hooks/useDeviceSignIn';

jest.mock('@sinkplane/shared', () =>
  jest.requireActual<object>('@/__tests__/unit/doubles/sinkplane-shared'),
);

function signInState(status: OIDCStatus): DeviceSignInState {
  return {
    status,
    userCode: null,
    verificationUriComplete: null,
    timeRemaining: null,
    message: '',
    restart: jest.fn(),
    requestNewCode: jest.fn(),
  };
}

describe('SignInInstructions', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it.each(['error', 'expired'] as const)('offers Try Again after %s', async (status) => {
    const signIn = signInState(status);
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<SignInInstructions signIn={signIn} />);

    await user.press(screen.getByText('Try Again'));

    expect(signIn.restart).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Get New Code')).not.toBeOnTheScreen();
  });

  it('offers a new code while polling', async () => {
    const signIn = signInState('polling');
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    await render(<SignInInstructions signIn={signIn} />);

    await user.press(screen.getByText('Get New Code'));

    expect(signIn.requestNewCode).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Try Again')).not.toBeOnTheScreen();
  });
});
