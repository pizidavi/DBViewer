import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Card, Text } from 'react-native-paper';

import SafeAreaView from '@components/SafeAreaView';

import type { TablesScreenProps } from './types';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { useDatabase, getTables } from 'app/services/databaseApi';

/**
 * Screen to show all tables in a database
 */
const TablesScreen = ({ navigation, route }: TablesScreenProps) => {
  const serverId = route.params.serverId;
  const databaseName = route.params.databaseName;

  const server = useAppSelector(state =>
    state.storage.servers.find(server => server.id === serverId),
  )!;

  // Query to use a database
  const { isSuccess: connected, isLoading: connecting } = useQuery({
    queryKey: ['use', databaseName],
    queryFn: () => useDatabase(databaseName),
    onError: (error: Error) => Alert.alert('Error', error.message),
    staleTime: 0,
    cacheTime: 0,
  });

  // Query to get all tables in a database
  const {
    refetch,
    data = [],
    isFetching,
  } = useQuery({
    queryKey: ['tables', { databaseName, serverName: server.name }],
    queryFn: getTables,
    onError: (error: Error) => Alert.alert('Error', error.message),
    enabled: connected,
  });

  // Set the title of the screen
  useEffect(() => {
    navigation.setOptions({
      title: `${databaseName}@${server.name}`,
    });
  }, [navigation, databaseName, server]);

  // Handle when a table is pressed
  const handleCardPress = (name: string) => {
    navigation.navigate('Query', {
      serverId: server.id,
      databaseName,
      tableName: name,
    });
  };

  return (
    <SafeAreaView>
      {connecting ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : connected ? (
        data ? (
          <FlatList
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            data={data}
            renderItem={({ item }) => (
              <TableItem
                key={item.name}
                tableName={item.name}
                onPress={handleCardPress}
              />
            )}
            contentContainerStyle={{ padding: 5, paddingVertical: 10 }}
          />
        ) : null
      ) : null}
    </SafeAreaView>
  );
};

type TableItemProps = {
  tableName: string;
  onPress: (tableName: string) => void;
};

/**
 * Component to show a table
 */
function TableItem({ tableName, onPress }: TableItemProps) {
  return (
    <Card onPress={() => onPress(tableName)} style={{ marginBottom: 10 }}>
      <Card.Content>
        <Text variant="titleSmall">{tableName}</Text>
      </Card.Content>
    </Card>
  );
}

export default TablesScreen;
