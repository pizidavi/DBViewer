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
import { useNavigation } from '@react-navigation/native';

const TablesScreen = ({ navigation, route }: TablesScreenProps) => {
  const databaseName = route.params.databaseName;
  const serverName = route.params.serverName;

  const { isSuccess: connected, isLoading: connecting } = useQuery({
    queryKey: ['use', databaseName],
    queryFn: () => useDatabase(databaseName),
    onError: (error: Error) => Alert.alert('Error', error.message),
    staleTime: 0,
    cacheTime: 0,
  });

  const {
    refetch,
    data = [],
    isFetching,
  } = useQuery({
    queryKey: ['tables', { databaseName, serverName }],
    queryFn: getTables,
    onError: (error: Error) => Alert.alert('Error', error.message),
    enabled: connected,
  });

  useEffect(() => {
    navigation.setOptions({
      title: `${databaseName}@${serverName}`,
    });
  }, [navigation]);

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
                serverName={serverName}
                databaseName={databaseName}
                tableName={item.name}
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
  serverName: string;
  databaseName: string;
  tableName: string;
};

function TableItem({ serverName, databaseName, tableName }: TableItemProps) {
  const navigation = useNavigation();
  return (
    <Card
      onPress={() =>
        navigation.navigate('Query', {
          serverName,
          databaseName,
          tableName,
        })
      }
      style={{ marginBottom: 10 }}
    >
      <Card.Content>
        <Text variant="titleSmall">{tableName}</Text>
      </Card.Content>
    </Card>
  );
}

export default TablesScreen;