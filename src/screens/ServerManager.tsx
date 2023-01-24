import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { nanoid } from '@reduxjs/toolkit';
import { Text, Button } from 'react-native-paper';
import { Formik, FormikHelpers } from 'formik';
import * as yup from 'yup';

import SafeAreaView from '@components/SafeAreaView';
import TextInputField from '@components/TextInputField';
import TextSecureInputField from '@components/TextSecureInputField';
import { capitalize } from 'utils/utils';

import type { ServerManagerScreenProps } from './types';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { addServer, editServer } from 'app/services/storage';

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
  const dispatch = useAppDispatch();
  const action = route.params?.action || 'new';
  const server = route.params?.server;

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
          {({ dirty, isValid, isSubmitting, handleSubmit }) => (
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

              {/* <Button // TODO: Test connection button
                mode="outlined"
                onPress={() => console.log('test connection')}
                disabled={!isValid || isSubmitting}
                style={styles.margin}
              >
                Test connection
              </Button> */}
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
