import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DeviceEventEmitter, Alert, View, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, Button, TextInput } from 'react-native-paper';
import type { AST, From } from 'node-sql-parser';
import { Parser } from 'node-sql-parser/build/mysql';

import { HeaderButton } from '@components/Header';
import SafeAreaView from '@components/SafeAreaView';
import Table from '@components/Table';

import type { QueryScreenProps } from './types';
import { useSnackBar } from 'contexts/Snackbar';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  useDatabase,
  execute,
  getTableColumnsInformationSchema,
  getPrimaryColumns,
} from 'app/services/databaseApi';
import { ICONS } from 'utils/icons';

const sqlParser = new Parser();

/**
 * Screen to execute the queries
 */
const QueryScreen = ({ navigation, route }: QueryScreenProps) => {
  const serverName = route.params.serverName;
  const databaseName = route.params.databaseName;
  const tableName = route.params.tableName;

  const snackbar = useSnackBar();
  const autoFetchQuery = useRef<boolean>(false);

  // State to store the AST of the current query
  const [currentAST, setCurrentAST] = useState<AST | null>(null);
  const currentTableName = useMemo<string | undefined>(() => {
    if (
      currentAST?.type === 'select' &&
      currentAST.from &&
      currentAST.from.length === 1 &&
      currentAST.from[0].table
    ) {
      const tables = currentAST.from as From[];
      return tables[0].table;
    }
    return undefined;
  }, [currentAST]);
  const currentTableColumns = useMemo<string[]>(() => {
    if (currentAST?.type === 'select' && Array.isArray(currentAST.columns))
      return currentAST.columns.map(col => col.expr.column);
    return [];
  }, [currentAST]);

  // Query to use a database
  const { isSuccess: connected, isLoading: connecting } = useQuery({
    queryKey: ['use', databaseName],
    queryFn: () => useDatabase(databaseName),
    onError: (error: Error) => Alert.alert('Error', error.message),
    staleTime: 0,
    cacheTime: 0,
  });

  // Query to get the columns information schema of the current table
  const { data: tableSchema } = useQuery({
    queryKey: ['columns-information-schema', databaseName, currentTableName],
    queryFn: () =>
      getTableColumnsInformationSchema(databaseName, currentTableName!),
    onError: (error: Error) => Alert.alert('Error', error.message),
    enabled: !!currentTableName,
  });

  // Get the primary columns of the current table
  const primaryColums = useMemo(
    () => (tableSchema ? getPrimaryColumns(tableSchema) : []),
    [tableSchema],
  );

  const [query, setQuery] = useState(
    tableName ? `SELECT * FROM ${tableName} \nLIMIT 100` : '',
  );

  // Query to execute the query
  const {
    refetch,
    data = [],
    isFetching,
  } = useQuery({
    queryKey: ['queries', query],
    queryFn: () => execute<Row[] | number>(query),
    onError: (error: Error) => Alert.alert('SQL Error', error.message),
    keepPreviousData: true,
    enabled: false,
  });

  // Add a listener to refetch the query
  useEffect(() => {
    DeviceEventEmitter.addListener('refetch.query', () => {
      handleSubmit();
    });
    return () => DeviceEventEmitter.removeAllListeners('refetch.query');
  }, []);

  // Fetch the default query when the connection is established
  useEffect(() => {
    if (!autoFetchQuery.current && connected && query) {
      handleSubmit();
      autoFetchQuery.current = true;
    }
  }, [connected]);

  // Set the header title and the header button
  useEffect(() => {
    navigation.setOptions({
      title: `${databaseName}@${serverName}`,
      headerRight: () => (
        <HeaderButton
          icon={ICONS.plus}
          title="New row"
          onPress={() => handleNewRow()}
          disabled={!!!currentTableName}
        />
      ),
    });
  }, [navigation, databaseName, serverName, currentTableName]);

  // Handle the submit of the query
  const handleSubmit = () => {
    if (!query) return Alert.alert('Abort', 'Insert a SQL Query');

    try {
      // Parse the query
      const ast = sqlParser.astify(query); // throw if parse fail
      if (Array.isArray(ast)) setCurrentAST(ast.length ? ast[0] : null);
      else setCurrentAST(ast);
    } catch (error) {
      setCurrentAST(null);
    }

    // Execute the query
    refetch({ throwOnError: true })
      .then(r => {
        if (typeof r.data === 'number')
          snackbar.show(`${r.data} row${r.data > 1 ? 's' : ''} affected`);
      })
      .catch(err => {});
  };

  // Handle the press of the new row button
  const handleNewRow = () => {
    if (!currentTableName) return;
    navigation.navigate('RowManager', {
      action: 'new',
      databaseName,
      tableName: currentTableName,
    });
  };

  // Handle the press of a row
  const handleRowPress = (row: Row) => {
    if (!currentTableName)
      return Alert.alert(
        'Query is not editable',
        'Edit of query from multiple table are not supported',
      );

    if (currentAST?.type !== 'select') return;
    if (
      currentAST.columns !== '*' &&
      !primaryColums.every(p => currentTableColumns.find(c => c === p))
    )
      return Alert.alert('Query is not editable');

    navigation.navigate('RowManager', {
      action: 'edit',
      databaseName,
      tableName: currentTableName,
      row,
    });
  };

  return (
    <SafeAreaView>
      {connecting ? (
        <ActivityIndicator style={{ flex: 1 }} />
      ) : connected ? (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 5, paddingVertical: 10 }}>
            <TextInput
              label="SQL Query"
              value={query}
              onChangeText={value => setQuery(value)}
              multiline
              numberOfLines={3}
              autoCorrect={false}
              autoComplete="off"
            />
            <Button
              mode="contained"
              onPress={() => handleSubmit()}
              loading={isFetching}
              disabled={isFetching}
              style={styles.margin}
            >
              Execute
            </Button>
          </View>

          {Array.isArray(data) && data.length ? (
            <Table data={data} onRowPress={handleRowPress} />
          ) : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  margin: {
    marginVertical: 5,
  },
});

export default QueryScreen;
