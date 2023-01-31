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
import { useSnackBar } from 'contexts/Snackbar';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  executeUpdate,
  getTableColumnsInformationSchema,
  getPrimaryColumns,
  getRow,
  columnsSchemaToRow,
  isNumber,
  isDecimal,
} from 'app/services/databaseApi';

const jsonSql = jsonToSql({
  separatedValues: false,
});
jsonSql.setDialect('mysql');

/**
 * Screen to add/edit/clone a row
 */
const RowManagerScreen = ({ navigation, route }: RowManagerScreenProps) => {
  const action = route.params.action;
  const databaseName = route.params.databaseName;
  const tableName = route.params.tableName;
  const row = route.params.row;

  const snackbar = useSnackBar();

  // Query to get the columns information schema of the table
  const { data: schema, isLoading } = useQuery({
    queryKey: ['columns-information-schema', databaseName, tableName],
    queryFn: () => getTableColumnsInformationSchema(databaseName, tableName),
    onError: (error: Error) => Alert.alert('Error', error.message),
  });

  // Query to get the all the data of the row if it's an edit or clone action
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

  // Mutation to execute the update query
  const mutation = useMutation({
    mutationFn: (query: string) => executeUpdate(query),
    onError: (error: Error) => Alert.alert('Error', error.message),
    onSuccess: rows => {
      snackbar.show(`${rows} row${rows > 1 ? 's' : ''} affected`);
      DeviceEventEmitter.emit('refetch.query');
      navigation.goBack();
    },
  });

  // Initial values of the form
  const initialValues: Row = useMemo(
    () =>
      action === 'new'
        ? columnsSchemaToRow(schema)
        : { ...row, ...completeRow },
    [action, row, completeRow],
  );

  // Primary keys of the table
  const primaryKeys = useMemo(() => getPrimaryColumns(schema ?? []), [schema]);

  // Form submit handler
  const onSubmit = async (values: Row, actions: FormikHelpers<Row>) => {
    // Escape single quotes
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

    // Build the query
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

  // Delete row handler
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

  // Set the header title and actions menu
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
          contentContainerStyle={{ padding: 5, paddingBottom: 10 }}
        >
          <Text variant="bodyLarge" style={styles.text}>
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
                          isDecimal(column.data_type)
                            ? 'decimal'
                            : isNumber(column.data_type)
                            ? 'numeric'
                            : 'text'
                        }
                        keyboardType={
                          isNumber(column.data_type) ? 'numeric' : 'default'
                        }
                        style={styles.margin}
                      />
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
                  style={styles.button}
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

/**
 * Component that show the actions menu
 */
function ActionsMenu({ handleClone, handleDelete }: ActionsMenuProps) {
  const [visible, setVisible] = React.useState(false);

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={<IconButton onPress={openMenu} icon={ICONS.more} />}
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
  button: {
    marginVertical: 5,
  },
  margin: {
    marginBottom: 10,
  },
  text: {
    marginVertical: 5,
  },
});

export default RowManagerScreen;
