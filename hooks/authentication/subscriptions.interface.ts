export interface ISubscription {
  startDate: Date;
  endDate: Date;
  plan: {
    id: string;
    title: string;
    description: string;
  };
  creator: string;
}
