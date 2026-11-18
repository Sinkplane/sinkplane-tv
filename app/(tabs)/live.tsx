import type { ReactElement } from 'react';
import { LivePlayer } from '@/components/live/LivePlayer';
import { LiveStatus } from '@/components/live/LiveStatus';
import { useLiveStream } from '@/hooks/useLiveStream';

export default function LiveScreen(): ReactElement {
  const live = useLiveStream();

  if (live.source !== null) {
    return (
      <LivePlayer
        source={live.source}
        paused={live.paused}
        loading={live.videoLoading}
        error={live.playerError}
        onLoad={live.onLoad}
        onBuffer={live.onBuffer}
        onError={live.onError}
        onRetry={live.refresh}
      />
    );
  }

  return <LiveStatus creator={live.creator} status={live.status} onRefresh={live.refresh} />;
}
