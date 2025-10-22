export interface TVMessage<T = Record<string, string>> {
  id: string;
  type: 'discover' | 'data' | 'command' | 'response' | 'heartbeat';
  payload: T;
  timestamp: Date;
  from: string;
  to?: string;
}
