import { Alert } from 'react-native';

export const alertLaunchError = (): void => {
  Alert.alert('Error', 'Error launching video. Please try again');
};
