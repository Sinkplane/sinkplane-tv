import { IUser } from '@/types/user.interface';

export interface IStatusResponse {
  selfUser: IUser;
  selfCreator: unknown | null;
  serviceMessages: unknown[];
  serviceDenied: unknown | null;
}
