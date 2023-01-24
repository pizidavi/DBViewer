import React, { useState, useCallback } from 'react';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { StyleSheet, Alert, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AnimatedFAB,
  Avatar,
  Card,
  Divider,
  IconButton,
  Menu,
} from 'react-native-paper';

import SafeAreaView from '@components/SafeAreaView';
import { ICONS } from 'utils/icons';

import type { HomeScreenProps } from './types';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { deleteServer } from 'app/services/storage';

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { servers } = useAppSelector(state => state.storage);

  const [isExtended, setIsExtended] = useState(true);

  const handleScrool = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const currentScrollPosition =
        Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
      setIsExtended(currentScrollPosition <= 0);
    },
    [],
  );

  return (
    <SafeAreaView>
      <FlatList
        data={servers}
        renderItem={({ item }) => <ServerItem {...item} />}
        contentContainerStyle={{ padding: 5, paddingVertical: 10 }}
        onScroll={handleScrool}
      />
      <AnimatedFAB
        icon={ICONS.plus}
        label="New Server"
        extended={isExtended}
        onPress={() => navigation.navigate('ServerManager')}
        style={styles.fab}
      />
    </SafeAreaView>
  );
};

function ServerItem(props: Server) {
  const navigation = useNavigation();
  return (
    <Card
      onPress={() => {
        navigation.navigate('Server', { id: props.id });
      }}
      style={styles.margin}
    >
      <Card.Title
        title={props.name}
        titleVariant="titleMedium"
        subtitle={`${props.host}:${props.port}`}
        subtitleVariant="labelMedium"
        left={_ => <Avatar.Icon {..._} icon={ICONS.database} />}
        right={_ => <RightMenu {..._} server={props} />}
      />
    </Card>
  );
}

function RightMenu({ server }: { size: number; server: Server }) {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={<IconButton onPress={openMenu} icon={ICONS.more}></IconButton>}
      anchorPosition="bottom"
    >
      <Menu.Item
        title="Edit"
        onPress={() => {
          navigation.navigate('ServerManager', { action: 'edit', server });
          closeMenu();
        }}
      />
      <Menu.Item
        title="Clone"
        onPress={() => {
          navigation.navigate('ServerManager', { action: 'clone', server });
          closeMenu();
        }}
      />
      <Divider />
      <Menu.Item
        title="Delete"
        onPress={() => {
          closeMenu();
          Alert.alert(
            'Are you sure?',
            `Do you want to delete "${server.name}"?`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Yes',
                onPress: () => dispatch(deleteServer(server.id)),
              },
            ],
            {
              cancelable: true,
            },
          );
        }}
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  margin: {
    marginBottom: 10,
  },
});

export default HomeScreen;
