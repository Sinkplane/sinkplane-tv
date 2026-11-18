import { type Channel, type Creator } from '@sinkplane/shared/types/creator-list.interface';
import type { CreatorInfo } from '@sinkplane/shared/types/video-post.interface';
import type { LiveStream } from '@sinkplane/shared/types/video.interface';
import {
  type ContentHistoryEntry,
  type TextTrack,
  type Video,
  type VideoDelivery,
  type VideoPost,
} from '@sinkplane/shared';
import { fixtureUser, image } from './fixture-world';

const OFFLINE_LIVESTREAM: LiveStream = {
  id: 'livestream-none',
  title: 'No livestream',
  description: '',
  thumbnail: image('live/none/thumb.jpg'),
  owner: '',
  channel: '',
  streamPath: '',
  offline: { title: 'Offline', description: '', thumbnail: image('live/none/offline.jpg') },
};

const videoCreator = (creator: Creator): Video['creator'] => ({
  id: creator.id,
  owner: creator.owner,
  title: creator.title,
  urlname: creator.urlname,
  description: creator.description,
  about: creator.about,
  category: creator.category,
  cover: creator.cover,
  icon: creator.icon,
  card: creator.card,
  liveStream: creator.liveStream ?? OFFLINE_LIVESTREAM,
  subscriptionPlans: [],
  discoverable: creator.discoverable,
  visibility: creator.visibility,
  subscriberCountDisplay: creator.subscriberCountDisplay,
  incomeDisplay: creator.incomeDisplay,
  defaultChannel: creator.defaultChannel,
  socialLinks: creator.socialLinks,
  channels: [],
});

const postCreator = (creator: Video['creator']): CreatorInfo => ({
  id: creator.id,
  owner: creator.owner.id,
  title: creator.title,
  urlname: creator.urlname,
  description: creator.description,
  about: creator.about,
  category: creator.category.title,
  cover: creator.cover,
  icon: creator.icon,
  card: creator.card,
  liveStream: creator.liveStream,
  subscriptionPlans: creator.subscriptionPlans,
  discoverable: creator.discoverable,
  visibility: creator.visibility,
  subscriberCountDisplay: creator.subscriberCountDisplay,
  incomeDisplay: creator.incomeDisplay,
  defaultChannel: creator.defaultChannel,
});

const requireChannel = (creator: Creator, channelId: string): Channel => {
  const channel = creator.channels.find((ch) => ch.id === channelId) ?? creator.channels[0];
  if (channel === undefined) {
    throw new Error(`Fixture creator ${creator.id} has no channels`);
  }
  return channel;
};

const videoChannel = (channel: Channel): Video['channel'] => ({ ...channel });

export interface FixtureVideoSpec {
  id: string;
  channelId: string;
  creator: Creator;
  index: number;
}

export const makeVideo = (spec: FixtureVideoSpec): Video => {
  const { creator, channelId, index } = spec;
  const channel = requireChannel(creator, channelId);
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

export const makeVideosForChannel = (creator: Creator, channelId: string, count = 26): Video[] =>
  Array.from({ length: count }, (_, i) =>
    makeVideo({
      id: `video-${creator.id}-${channelId}-${String(i + 1)}`,
      channelId,
      creator,
      index: i,
    }),
  );

export const makeVideoPost = (
  video: Video,
  progress = 0,
  textTracks: TextTrack[] = [],
): VideoPost => ({
  id: video.id,
  guid: video.guid,
  title: video.title,
  text: video.text,
  textMarkdown: video.textMarkdown,
  type: video.type,
  channel: video.channel,
  tags: video.tags,
  attachmentOrder: video.attachmentOrder,
  releaseDate: video.releaseDate,
  duration: video.metadata.videoDuration,
  likes: video.likes,
  dislikes: video.dislikes,
  score: video.score,
  comments: video.comments,
  creator: postCreator(video.creator),
  wasReleasedSilently: video.wasReleasedSilently,
  metadata: video.metadata,
  galleryAttachments: [],
  selfUserInteraction: video.selfUserInteraction,
  thumbnail: video.thumbnail,
  isAccessible: video.isAccessible,
  userInteraction: [],
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
      textTracks,
      selfUserInteraction: null,
      thumbnail: video.thumbnail,
      isAccessible: true,
      blogPosts: [video.id],
      timelineSprite: { width: 0, height: 0, path: '', childImages: [] },
    },
  ],
  audioAttachments: [],
  pictureAttachments: [],
  progress,
});

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
      variants: [
        defaultVariant(`/vod/${videoId}/720/60/index.m3u8`),
        defaultVariant(`/vod/${videoId}/1080/60/index.m3u8`),
      ],
    },
  ],
});

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
          meta: {
            common: {
              access: { deniedReason: 'notEntitled', deniedMessage: 'Upgrade your subscription' },
            },
          },
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
