import { act, render } from '@testing-library/react-native';
import type { ReactVideoProps } from 'react-native-video';

import { VideoPlayer } from '@/components/videos/VideoPlayer';

const mockSaveProgress = jest.fn();
const mockRendered: { props: ReactVideoProps | null } = { props: null };

jest.mock('@sinkplane/shared', () => ({
  useUpdateVideoProgress: () => ({ mutate: mockSaveProgress }),
  updateVideoProgress: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-video', () => (props: ReactVideoProps): null => {
  mockRendered.props = props;
  return null;
});

const nativeVideoProps = (): ReactVideoProps => {
  if (mockRendered.props === null) {
    throw new Error('The native video player did not render');
  }
  return mockRendered.props;
};

describe('VideoPlayer', () => {
  it('plays from the start with no-op buffer and end handlers when none are given', async () => {
    const handleError = jest.fn();
    await render(
      <VideoPlayer
        source={{ uri: 'https://edge.test/live.m3u8' }}
        id="live"
        handleError={handleError}
      />,
    );

    const props = nativeVideoProps();
    expect(props.paused).toBe(false);
    expect(props.controls).toBe(true);
    await act(() => {
      props.onBuffer?.({ isBuffering: true });
      props.onEnd?.();
      props.onLoad?.({
        currentTime: 0,
        duration: 10,
        naturalSize: { width: 1, height: 1, orientation: 'landscape' },
        audioTracks: [],
        textTracks: [],
        videoTracks: [],
      });
    });
    expect(handleError).not.toHaveBeenCalled();
  });

  it('stays paused and saves nothing while the parent pauses it', async () => {
    await render(
      <VideoPlayer
        source={{ uri: 'https://edge.test/vod.m3u8' }}
        id="vod"
        token="token"
        paused
        handleError={jest.fn()}
      />,
    );

    const props = nativeVideoProps();
    expect(props.paused).toBe(true);
    await act(() => {
      props.onProgress?.({ currentTime: 40, playableDuration: 50, seekableDuration: 60 });
    });
    expect(mockSaveProgress).not.toHaveBeenCalled();
  });
});
