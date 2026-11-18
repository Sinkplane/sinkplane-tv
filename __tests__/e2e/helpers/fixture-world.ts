import { type Channel, type Creator } from '@sinkplane/shared/types/creator-list.interface';
import type { Image } from '@sinkplane/shared/types/video.interface';
import { type Subscription, type User } from '@sinkplane/shared';

export const LIVESTREAM_ID = '5c13f3c006f1be15e08e05c0';

export const image = (path: string): Image => ({
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
    offline: {
      title: 'Offline',
      description: 'Not live right now',
      thumbnail: image('live/tech/offline.jpg'),
    },
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
