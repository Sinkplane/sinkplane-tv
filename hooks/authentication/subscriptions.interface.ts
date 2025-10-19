export interface ISubscriptionPlan {
  id: string;
  title: string;
  description: string;
  price: string;
  priceYearly: string;
  currency: string;
  logo: string | null;
  interval: string;
  featured: boolean;
  allowGrandfatheredAccess: boolean;
  discordServers: string[];
  discordRoles: string[];
  enabled: boolean;
  enabledGlobal: boolean;
}

export interface ISubscription {
  startDate: string;
  endDate: string;
  paymentID: number;
  interval: string;
  paymentCancelled: boolean;
  plan: ISubscriptionPlan;
  creator: string;
}
