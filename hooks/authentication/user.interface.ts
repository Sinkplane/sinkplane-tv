export interface IProfileImage {
  width: number;
  height: number;
  path: string;
  childImages?: Array<{
    width: number;
    height: number;
    path: string;
  }>;
}

export interface IUser {
  id: string;
  username: string;
  profileImage: IProfileImage;
  email?: string;
  displayName?: string;
  creators?: string[];
  scheduledDeletionDate?: string | null;
}
