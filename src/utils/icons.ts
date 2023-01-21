import { Platform } from 'react-native';

export const ICONS = {
  more: Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical',
};
