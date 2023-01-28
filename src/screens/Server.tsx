import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Card,
  IconButton,
  Menu,
  Text,
} from 'react-native-paper';

import SafeAreaView from '@components/SafeAreaView';
import { ICONS } from 'utils/icons';

import type { ServerScreenProps } from './types';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { connect, disconnect, getDatabases } from 'app/services/databaseApi';

/**
 * Screen to show the databases of a server
 */
const ServerScreen = ({ navigation, route }: ServerScreenProps) => {
  // Get the server from the store
  const server = useAppSelector(state =>
    state.storage.servers.find(server => server.id === route.params.id),
  );
  if (!server) {
    Alert.alert(
      'Error',
      'Server not found',
      [{ text: 'Home', onPress: () => navigation.navigate('Home') }],
      {
        cancelable: false,
      },
    );
    return <SafeAreaView></SafeAreaView>;
  }

  // Query to connect to the server
  const {
    refetch: connectServer,
    isSuccess: connected,
    isLoading: connecting,
  } = useQuery({
    queryKey: ['connect'],
    queryFn: () =>
      connect({
        host: server.host,
        port:
          typeof server.port === 'string' ? parseInt(server.port) : server.port,
        username: server.username,
        password: server.password,
      }),
    onError: error =>
      Alert.alert(
        'Connection failed',
        error instanceof Error ? error.message : undefined,
        [
          {
            text: 'Back',
            onPress: () => navigation.navigate('Home'),
            style: 'cancel',
          },
          {
            text: 'Retry',
            onPress: () => connectServer({ throwOnError: true }),
          },
        ],
        {
          cancelable: false,
        },
      ),
    enabled: false,
    staleTime: 0,
    cacheTime: 0,
  });

  // Query to get the databases of the server
  const {
    data = [],
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['databases', server.id],
    queryFn: getDatabases,
    enabled: connected,
  });

  // Connect to the server when the screen is mounted
  useEffect(() => {
    setTimeout(() => connectServer(), 1); // Manage: Not Host
    return () => {
      // Disconnect from the server when the screen is unmounted
      disconnect().catch(error => {
        if (error.code !== '404') console.warn(error);
      });
    };
  }, []);

  // Set the title of the screen to the server name
  useEffect(() => {
    navigation.setOptions({
      title: server.name,
    });
  }, [navigation, server]);

  return (
    <SafeAreaView>
      {connecting ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : connected ? (
        error ? (
          <Text>{error instanceof Error ? error.message : 'Error'}</Text>
        ) : (
          <FlatList
            keyboardDismissMode="on-drag"
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
            data={data}
            renderItem={({ item }) => (
              <DatabaseItem
                key={item.name}
                name={item.name}
                serverName={server.name}
              />
            )}
            contentContainerStyle={{ padding: 5, paddingVertical: 10 }}
          />
        )
      ) : null}
    </SafeAreaView>
  );
};

type DatabaseItemProps = {
  name: string;
  serverName: string;
};

/**
 * Component to show a database
 */
function DatabaseItem({ name, serverName }: DatabaseItemProps) {
  const navigation = useNavigation();
  return (
    <Card
      onPress={() =>
        navigation.navigate('Query', { serverName, databaseName: name })
      }
      style={styles.margin}
    >
      <Card.Title
        title={name}
        titleVariant="titleSmall"
        right={_ => (
          <RightMenu {..._} serverName={serverName} databaseName={name} />
        )}
      />
    </Card>
  );
}

/**
 * Component to show the right menu of a database
 */
function RightMenu({
  serverName,
  databaseName,
}: {
  size: number;
  serverName: string;
  databaseName: string;
}) {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={<IconButton onPress={openMenu} icon={ICONS.more} />}
      anchorPosition="bottom"
    >
      <Menu.Item
        title="Tables"
        onPress={() => {
          navigation.navigate('Tables', { serverName, databaseName });
          closeMenu();
        }}
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  margin: {
    marginBottom: 10,
  },
});

export default ServerScreen;
