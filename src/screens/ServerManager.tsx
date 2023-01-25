import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import { nanoid } from '@reduxjs/toolkit';
import { useMutation } from '@tanstack/react-query';
import { Text, Button } from 'react-native-paper';
import { Formik, FormikHelpers } from 'formik';
import * as yup from 'yup';

import SafeAreaView from '@components/SafeAreaView';
import TextInputField from '@components/TextInputField';
import TextSecureInputField from '@components/TextSecureInputField';
import { capitalize } from 'utils/utils';
import type { Config } from 'lib/MySqlConnector';

import type { ServerManagerScreenProps } from './types';
import { useSnackBar } from 'contexts/Snackbar';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { addServer, editServer } from 'app/services/storage';
import { connect, disconnect } from 'app/services/databaseApi';

const serverSchema = yup.object({
  id: yup.string().required(),
  name: yup.string().required(),
  host: yup.string().required(),
  port: yup.number().integer().min(1).max(65535).required(),
  username: yup.string().required(),
  password: yup.string().optional(),
});

const ServerManagerScreen = ({
  navigation,
  route,
}: ServerManagerScreenProps) => {
  const action = route.params?.action || 'new';
  const server = route.params?.server;

  const dispatch = useAppDispatch();
  const snackbar = useSnackBar();

  const connection = useMutation({
    mutationFn: (config: Config) => connect(config),
    onSuccess: () => {
      disconnect().catch(error => {
        if (error.code !== '404') console.warn(error);
      });
      snackbar.show('Connection established!');
    },
    onError: error =>
      Alert.alert(
        'Connection failed',
        error instanceof Error ? error.message : undefined,
      ),
  });

  const initialValues = useMemo(
    () =>
      server
        ? action === 'clone'
          ? { ...server, id: nanoid() }
          : server
        : {
            id: nanoid(),
            name: '',
            host: '',
            port: '3306',
            username: '',
            password: '',
          },
    [server, action],
  );

  useEffect(() => {
    navigation.setOptions({
      title: `${capitalize(action)} Server`,
    });
  }, [navigation, action]);

  const handleTestConnection = (values: Server) => {
    connection.mutate({
      host: values.host,
      port:
        typeof values.port === 'string' ? parseInt(values.port) : values.port,
      username: values.username,
      password: values.password,
    });
  };

  const onSubmit = async (values: Server, actions: FormikHelpers<Server>) => {
    switch (action) {
      case 'new':
      case 'clone':
        dispatch(addServer(values));
        break;
      case 'edit':
        dispatch(editServer(values));
        break;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView>
      <ScrollView
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 5, paddingVertical: 10 }}
      >
        <Text>ID: {initialValues.id}</Text>
        <Formik
          validationSchema={serverSchema}
          initialValues={initialValues}
          onSubmit={onSubmit}
          validateOnMount={true}
        >
          {({ dirty, isValid, isSubmitting, handleSubmit, values }) => (
            <>
              <TextInputField name="name" label="Name" style={styles.margin} />
              <TextInputField name="host" label="Host" style={styles.margin} />
              <TextInputField name="port" label="Port" style={styles.margin} />
              <TextInputField
                name="username"
                label="Username"
                style={styles.margin}
              />
              <TextSecureInputField
                name="password"
                label="Password"
                style={styles.marginEnd}
              />

              <Button
                mode="outlined"
                onPress={() => handleTestConnection(values)}
                loading={connection.isLoading}
                disabled={!isValid || isSubmitting || connection.isLoading}
                style={styles.margin}
              >
                Test connection
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isSubmitting}
                disabled={
                  !isValid || isSubmitting || (action === 'edit' && !dirty)
                }
                style={styles.marginEnd}
              >
                {action === 'new'
                  ? 'Create'
                  : action === 'edit'
                  ? 'Edit'
                  : 'Clone'}
              </Button>
            </>
          )}
        </Formik>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  margin: {
    marginBottom: 5,
  },
  marginEnd: {
    marginBottom: 10,
  },
});

export default ServerManagerScreen;
