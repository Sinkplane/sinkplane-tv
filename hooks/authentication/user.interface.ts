export interface IUser {
  id: string;
  username: string;
  profileImage: {
    width: number;
    height: number;
    path: string;
  };
}
