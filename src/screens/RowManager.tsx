import React, { useEffect, useMemo, useCallback } from 'react';
import {
  DeviceEventEmitter,
  StyleSheet,
  Alert,
  ScrollView,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Divider,
  Button,
  IconButton,
  Menu,
  Text,
} from 'react-native-paper';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Formik, FormikHelpers } from 'formik';
import jsonToSql from 'json-sql';

import SafeAreaView from '@components/SafeAreaView';
import TextInputField from '@components/TextInputField';
import { capitalize } from 'utils/utils';
import { ICONS } from 'utils/icons';

import type { RowManagerScreenProps } from './types';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  executeUpdate,
  getTableColumnsInformationSchema,
  getPrimaryColumns,
  getRow,
  columnsSchemaToRow,
  isNumber,
} from 'app/services/databaseApi';

const jsonSql = jsonToSql({
  separatedValues: false,
});
jsonSql.setDialect('mysql');

const RowManagerScreen = ({ navigation, route }: RowManagerScreenProps) => {
  const action = route.params.action;
  const databaseName = route.params.databaseName;
  const tableName = route.params.tableName;
  const row = route.params.row;

  const { data: schema, isLoading } = useQuery({
    queryKey: ['columns-information-schema', databaseName, tableName],
    queryFn: () => getTableColumnsInformationSchema(databaseName, tableName),
    onError: (error: Error) => Alert.alert('Error', error.message),
  });
  const { data: completeRow = {}, isFetching } = useQuery({
    queryKey: ['row', row],
    queryFn: () =>
      getRow(
        tableName,
        getPrimaryColumns(schema!).map(p => ({ name: p, value: row![p] })),
      ),
    onError: (error: Error) => Alert.alert('Error', error.message),
    enabled:
      !!schema &&
      !!row &&
      !schema.every(col => Object.keys(row).find(c => c === col.name)),
  });

  const mutation = useMutation({
    mutationFn: (query: string) => executeUpdate(query),
    onError: (error: Error) => Alert.alert('Error', error.message),
    onSuccess: () => {
      DeviceEventEmitter.emit('refetch.query');
      navigation.goBack();
    },
  });

  const initialValues: Row =
    action === 'new' ? columnsSchemaToRow(schema) : { ...row, ...completeRow };

  const primaryKeys = useMemo(() => getPrimaryColumns(schema ?? []), [schema]);

  const onSubmit = async (values: Row, actions: FormikHelpers<Row>) => {
    // Map values changing ' to \'
    values = Object.entries(values).reduce((diff, [colName, val]) => {
      return {
        ...diff,
        [colName]: typeof val === 'string' ? val.replace(/'/g, "\\'") : val,
      };
    }, {});

    // Get only changed values rispect of initialValues
    const diff: Row = Object.entries(values).reduce((diff, [colName, val]) => {
      if (initialValues[colName] === val) return diff;
      return { ...diff, [colName]: val };
    }, {});

    const valuesWithoutPrimaryKeyIfVoid = Object.entries(values).reduce(
      (vals, [colName, val]) => {
        if (primaryKeys.find(p => p === colName) && !val) return vals;
        return { ...vals, [colName]: val };
      },
      {},
    );

    const insertJson = {
      type: 'insert',
      values: valuesWithoutPrimaryKeyIfVoid,
    };
    const updateJson = {
      type: 'update',
      modifier: diff,
      condition: primaryKeys.map(colName => ({
        [colName]: initialValues[colName],
      })),
    };
    const sql = jsonSql.build({
      table: tableName,
      ...(action === 'edit' ? updateJson : insertJson),
    });
    return mutation.mutateAsync(sql.query);
  };

  const handleDeleteRow = useCallback(() => {
    const deleteJson = {
      type: 'remove',
      table: tableName,
      condition: primaryKeys.map(colName => ({
        [colName]: initialValues[colName],
      })),
    };
    const sql = jsonSql.build(deleteJson);

    Alert.alert(
      'Are you sure?',
      `Do you want to delete this row?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => mutation.mutate(sql.query),
        },
      ],
      {
        cancelable: true,
      },
    );
  }, [initialValues, primaryKeys]);

  useEffect(() => {
    navigation.setOptions({
      title: `${capitalize(action)} Row`,
      headerRight: () =>
        action === 'edit' ? (
          <ActionsMenu
            handleClone={() =>
              navigation.navigate('RowManager', {
                action: 'clone',
                databaseName,
                tableName,
                row,
              })
            }
            handleDelete={handleDeleteRow}
          />
        ) : null,
    });
  }, [navigation, action, handleDeleteRow]);

  return (
    <SafeAreaView>
      {isLoading || isFetching ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : schema ? (
        <ScrollView
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          style={{ padding: 5, paddingBottom: 10 }}
        >
          <Text variant="bodyLarge" style={{ marginVertical: 5 }}>
            Table: {tableName}
          </Text>
          <Formik
            initialValues={initialValues}
            onSubmit={onSubmit}
            validateOnMount={true}
          >
            {({ dirty, isValid, isSubmitting, handleSubmit }) => (
              <>
                {schema.map(column => {
                  const label = `${column.name} | ${column.type}${
                    column.key === 'PRI' ? ' *' : ''
                  }`;
                  return (
                    <View key={column.name}>
                      <TextInputField // IMPROVE: Change to TreeState TextInput
                        name={column.name}
                        label={label}
                        helperText={column.comment}
                        inputMode={
                          isNumber(column.data_type) ? 'numeric' : 'text'
                        }
                        keyboardType={
                          isNumber(column.data_type) ? 'numeric' : 'default'
                        }
                        style={styles.margin}
                      />
                      <Divider style={{ marginVertical: 5 }} />
                    </View>
                  );
                })}

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={isSubmitting || mutation.isLoading}
                  disabled={
                    !isValid || isSubmitting || (action === 'edit' && !dirty)
                  }
                  style={[styles.margin, { marginTop: 5 }]}
                >
                  {action === 'edit' ? 'Edit' : 'Create'}
                </Button>
              </>
            )}
          </Formik>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
};

type ActionsMenuProps = {
  handleClone: () => void;
  handleDelete: () => void;
};

function ActionsMenu({ handleClone, handleDelete }: ActionsMenuProps) {
  const [visible, setVisible] = React.useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={<IconButton onPress={openMenu} icon={ICONS.more}></IconButton>}
    >
      <Menu.Item
        title="Clone"
        onPress={() => {
          handleClone();
          closeMenu();
        }}
      />
      <Menu.Item
        title="Delete"
        onPress={() => {
          handleDelete();
          closeMenu();
        }}
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  margin: {
    marginBottom: 5,
  },
});

export default RowManagerScreen;
