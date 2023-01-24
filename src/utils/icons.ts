import { Platform } from 'react-native';

export const ICONS = {
  database: 'database',
  eye: 'eye',
  more: Platform.OS === 'ios' ? 'dots-horizontal' : 'dots-vertical',
  plus: 'plus',
};
