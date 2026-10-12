/**
 * Deterministic Floatplane API fixtures for the E2E suite.
 *
 * The world:
 *  - 1 user (testuser)
 *  - 2 subscriptions → creators: "Tech Channel" (2 channels) and "Gaming Channel" (2 channels)
 *  - 26 videos per channel (paginated 20/page by the mock API)
 *  - a live stream that is offline by default
 */

import { Channel, Creator } from '@/types/creator-list.interface';
import { Subscription } from '@/types/subscriptions.interface';
import { VideoPost } from '@/types/video-post.interface';
import { VideoDelivery } from '@/types/video-delivery.interface';
import { User } from '@/types/user.interface';
import { Video } from '@/types/video.interface';
import { ContentHistoryEntry } from '@/types/history.interface';

export const LIVESTREAM_ID = '5c13f3c006f1be15e08e05c0';

const image = (path: string) => ({
  width: 1280,
  height: 720,
  path: `https://cdn.floatplane.test/${path}`,
  childImages: [],
});

export const fixtureUser: User = {
  id: 'user-1',
  username: 'testuser',
  displayName: 'Test User',
  profileImage: image('users/testuser/avatar.png'),
};

const makeChannel = (id: string, title: string, order: number): Channel => ({
  id,
  creator: '',
  title,
  urlname: title.toLowerCase().replace(/\s+/g, '-'),
  about: `About ${title}`,
  order,
  cover: image(`channels/${id}/cover.jpg`),
  card: image(`channels/${id}/card.jpg`),
  icon: image(`channels/${id}/icon.png`),
  socialLinks: {},
});

export const techMainChannel = makeChannel('ch-tech-main', 'Main Channel', 0);
export const techSideChannel = makeChannel('ch-tech-side', 'Side Channel', 1);
export const gamingMainChannel = makeChannel('ch-gaming-main', 'Main Channel', 0);
export const gamingSideChannel = makeChannel('ch-gaming-side', 'Bonus Channel', 1);

export const techCreator: Creator = {
  id: 'creator-tech',
  owner: { id: 'owner-1', username: 'techowner' },
  title: 'Tech Channel',
  urlname: 'techchannel',
  description: 'All about tech',
  about: 'Tech everything',
  category: { id: 'cat-1', title: 'Tech' },
  cover: image('creators/tech/cover.jpg'),
  icon: image('creators/tech/icon.png'),
  card: image('creators/tech/card.jpg'),
  discoverable: true,
  visibility: 'public',
  subscriberCountDisplay: '1.2M',
  incomeDisplay: true,
  defaultChannel: techMainChannel.id,
  socialLinks: { youtube: 'https://youtube.example/tech' },
  channels: [techMainChannel, techSideChannel],
  discordServers: [],
  subscriptionPlans: [],
  liveStream: {
    id: LIVESTREAM_ID,
    title: 'Tech Live Stream',
    description: 'Live tech talk',
    thumbnail: image('live/tech/thumb.jpg'),
    owner: 'creator-tech',
    channel: techMainChannel.id,
    streamPath: '/live/tech',
    offline: { title: 'Offline', description: 'Not live right now', thumbnail: image('live/tech/offline.jpg') },
  },
};

export const gamingCreator: Creator = {
  id: 'creator-gaming',
  owner: { id: 'owner-2', username: 'gamingowner' },
  title: 'Gaming Channel',
  urlname: 'gamingchannel',
  description: 'All about games',
  about: 'Games everything',
  category: { id: 'cat-2', title: 'Gaming' },
  cover: image('creators/gaming/cover.jpg'),
  icon: image('creators/gaming/icon.png'),
  card: image('creators/gaming/card.jpg'),
  discoverable: true,
  visibility: 'public',
  subscriberCountDisplay: '800K',
  incomeDisplay: true,
  defaultChannel: gamingMainChannel.id,
  socialLinks: {},
  channels: [gamingMainChannel, gamingSideChannel],
  discordServers: [],
  subscriptionPlans: [],
};

export const fixtureCreators: Creator[] = [techCreator, gamingCreator];

const makeSubscription = (creatorId: string, planTitle: string): Subscription => ({
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2027-01-01T00:00:00.000Z',
  paymentID: 1,
  interval: 'month',
  paymentCancelled: false,
  creator: creatorId,
  plan: {
    id: `plan-${creatorId}`,
    title: planTitle,
    description: '',
    price: '5.00',
    priceYearly: '50.00',
    currency: 'USD',
    logo: null,
    interval: 'month',
    featured: false,
    allowGrandfatheredAccess: false,
    discordServers: [],
    discordRoles: [],
    enabled: true,
    enabledGlobal: true,
  },
});

export const fixtureSubscriptions: Subscription[] = [
  makeSubscription(techCreator.id, 'Tech Standard'),
  makeSubscription(gamingCreator.id, 'Gaming Standard'),
];

const videoCreator = (creator: Creator): Video['creator'] =>
  ({
    ...creator,
    channels: [],
  }) as unknown as Video['creator'];

const videoChannel = (channel: Channel): Video['channel'] => ({ ...channel });

export interface FixtureVideoSpec {
  id: string;
  channelId: string;
  creator: Creator;
  index: number;
}

/**
 * Deterministic video: index 0 is the newest (releaseDate DESC order matches id numbering).
 * Video 01 carries values chosen to pin the display formatting regressions:
 * likes 1,500,000 → "1.5M", duration 3725 → "1:02:05".
 */
export const makeVideo = (spec: FixtureVideoSpec): Video => {
  const { creator, channelId, index } = spec;
  const channel = creator.channels.find(ch => ch.id === channelId) ?? creator.channels[0];
  const numbered = String(index + 1).padStart(2, '0');
  const isFormattingProbe = index === 0;
  return {
    id: spec.id,
    guid: `guid-${spec.id}`,
    title: `${channel.title} Video ${numbered}`,
    text: `<p>Description for ${channel.title} video ${numbered}</p>`,
    textMarkdown: '',
    type: 'blogPost',
    channel: videoChannel(channel),
    tags: [],
    attachmentOrder: [],
    releaseDate: new Date(Date.UTC(2026, 0, 1, 12, 0, 0) - index * 86400000).toISOString(),
    likes: isFormattingProbe ? 1500000 : 1000 + index * 10,
    dislikes: 1,
    score: 1,
    comments: 0,
    creator: videoCreator(creator),
    wasReleasedSilently: false,
    metadata: {
      hasVideo: true,
      videoCount: 1,
      videoDuration: isFormattingProbe ? 3725 : 1200 + index,
      hasAudio: false,
      audioCount: 0,
      audioDuration: 0,
      hasPicture: false,
      pictureCount: 0,
      isFeatured: false,
      displayDuration: 0,
      hasGallery: false,
      galleryCount: 0,
    },
    galleryAttachments: [],
    selfUserInteraction: null,
    thumbnail: image(`videos/${spec.id}/thumb.jpg`),
    isAccessible: true,
    videoAttachments: [`attachment-${spec.id}`],
    audioAttachments: [],
    pictureAttachments: [],
  };
};

/** 26 videos for a creator/channel pair, newest first. */
export const makeVideosForChannel = (creator: Creator, channelId: string, count = 26): Video[] =>
  Array.from({ length: count }, (_, i) =>
    makeVideo({ id: `video-${creator.id}-${channelId}-${i + 1}`, channelId, creator, index: i }),
  );

export const makeVideoPost = (video: Video, progress = 0): VideoPost =>
  ({
    ...video,
    duration: video.metadata.videoDuration,
    videoAttachments: [
      {
        id: `attachment-${video.id}`,
        guid: `guid-${video.id}`,
        title: video.title,
        type: 'video',
        description: '',
        releaseDate: video.releaseDate,
        duration: video.metadata.videoDuration,
        creator: video.creator.id,
        likes: 0,
        dislikes: 0,
        score: 0,
        isProcessing: false,
        primaryBlogPost: video.id,
        levels: [],
        textTracks: [],
        selfUserInteraction: null,
        thumbnail: video.thumbnail,
        isAccessible: true,
        blogPosts: [video.id],
        timelineSprite: { width: 0, height: 0, path: '', childImages: [] },
      },
    ],
    progress,
  }) as unknown as VideoPost;

const defaultVariant = (path: string, enabled = true) => ({
  url: path,
  name: path,
  label: path,
  qualityLevel: 1,
  mimeType: 'application/vnd.apple.mpegurl',
  order: 1,
  enabled,
  meta: {},
});

export const makeVideoDelivery = (videoId: string): VideoDelivery => ({
  groups: [
    {
      id: `group-${videoId}`,
      label: 'vod',
      origins: [{ id: 'origin-1', url: 'https://vfd.floatplane.test', label: 'edge' }],
      variants: [defaultVariant(`/vod/${videoId}/720/60/index.m3u8`), defaultVariant(`/vod/${videoId}/1080/60/index.m3u8`)],
    },
  ],
});

/** Every variant is either disabled or access-denied — nothing playable. */
export const makeDeniedVideoDelivery = (videoId: string): VideoDelivery => ({
  groups: [
    {
      id: `group-${videoId}`,
      label: 'vod',
      origins: [{ id: 'origin-1', url: 'https://vfd.floatplane.test', label: 'edge' }],
      variants: [
        defaultVariant(`/vod/${videoId}/360/60/index.m3u8`, false),
        {
          ...defaultVariant(`/vod/${videoId}/480/60/index.m3u8`),
          meta: { common: { access: { deniedReason: 'notEntitled', deniedMessage: 'Upgrade your subscription' } } },
        },
      ],
    },
  ],
});

export const makeLiveVideoDelivery = (): VideoDelivery => ({
  groups: [
    {
      id: 'group-live',
      label: 'live',
      origins: [{ id: 'origin-live', url: 'https://live.floatplane.test', label: 'live-edge' }],
      variants: [defaultVariant('/live/tech/master.m3u8')],
    },
  ],
});

export const makeHistoryEntry = (video: Video, progress: number): ContentHistoryEntry => ({
  userId: fixtureUser.id,
  contentId: video.id,
  contentType: 'blogPost',
  progress,
  updatedAt: new Date(Date.UTC(2026, 0, 15, 12, 0, 0)).toISOString(),
  blogPost: video,
});
