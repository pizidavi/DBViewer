import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  ServerManager:
    | { action: 'new' | 'edit' | 'clone'; server: Server }
    | undefined;
  Server: { id: string };
  Tables: { serverName: string; databaseName: string };
  Query: { serverName: string; databaseName: string; tableName?: string };
  RowManager: {
    action: 'new' | 'edit' | 'clone';
    databaseName: string;
    tableName: string;
    row?: Row;
  };
};

export type HomeScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Home'
>;

export type ServerManagerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'ServerManager'
>;

export type ServerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Server'
>;

export type QueryScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Query'
>;

export type TablesScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Tables'
>;

export type RowManagerScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RowManager'
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
