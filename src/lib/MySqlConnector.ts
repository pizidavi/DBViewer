import { NativeModules } from 'react-native';

export interface MySqlConnectorConfig {
  host: string;
  port: number;
  username: string;
  password: string;
}

interface MySqlConnector {
  connect: (config: MySqlConnectorConfig) => Promise<boolean>;
  close: () => Promise<void>;
  execute: <T>(query: string) => Promise<T>;
  executeQuery: <T>(query: string) => Promise<T>;
  executeUpdate: (query: string) => Promise<number>;
}

/**
 * This exposes the native MySqlConnectorModule module as a JS module.
 */
const { MySqlConnectorModule } = NativeModules;
export default MySqlConnectorModule as MySqlConnector;
