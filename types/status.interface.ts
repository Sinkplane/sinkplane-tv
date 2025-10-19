import { IUser } from '@/hooks/authentication/user.interface';

export interface IStatusResponse {
  selfUser: IUser;
  selfCreator: unknown | null;
  serviceMessages: unknown[];
  serviceDenied: unknown | null;
}
