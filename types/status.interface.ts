import { User } from '@/types/user.interface';

export interface IStatusResponse {
  selfUser: User;
  selfCreator: unknown | null;
  serviceMessages: unknown[];
  serviceDenied: unknown | null;
}
