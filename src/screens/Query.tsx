import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DeviceEventEmitter, Alert, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Button,
  DataTable,
  TextInput,
} from 'react-native-paper';
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

const sqlParser = new Parser();

const QueryScreen = ({ navigation, route }: QueryScreenProps) => {
  const serverName = route.params.serverName;
  const databaseName = route.params.databaseName;
  const tableName = route.params.tableName ?? null;

  const snackbar = useSnackBar();
  const autoFetchQuery = useRef<boolean>(false);

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

  const { isSuccess: connected, isLoading: connecting } = useQuery({
    queryKey: ['use', databaseName],
    queryFn: () => useDatabase(databaseName),
    onError: (error: Error) => Alert.alert('Error', error.message),
    staleTime: 0,
    cacheTime: 0,
  });
  const { data: tableSchema } = useQuery({
    queryKey: ['columns-information-schema', databaseName, currentTableName],
    queryFn: () =>
      getTableColumnsInformationSchema(databaseName, currentTableName!),
    onError: (error: Error) => Alert.alert('Error', error.message),
    enabled: !!currentTableName,
  });

  const [query, setQuery] = useState(
    tableName ? `SELECT * FROM ${tableName} \nLIMIT 100` : '',
  );
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

  useEffect(() => {
    DeviceEventEmitter.addListener('refetch.query', () => {
      handleSubmit();
    });
    return () => DeviceEventEmitter.removeAllListeners('refetch.query');
  }, []);

  useEffect(() => {
    if (!autoFetchQuery.current && connected && query) {
      handleSubmit();
      autoFetchQuery.current = true;
    }
  }, [connected]);

  useEffect(() => {
    navigation.setOptions({
      title: `${databaseName}@${serverName}`,
      headerRight: () => (
        <HeaderButton
          icon="plus"
          title="New row"
          onPress={() => handleNewRow()}
          disabled={!!!currentTableName}
        />
      ),
    });
  }, [navigation, currentTableName]);

  const handleSubmit = () => {
    if (!query) return Alert.alert('Abort', 'Insert a SQL Query');

    try {
      const ast = sqlParser.astify(query);
      if (Array.isArray(ast)) setCurrentAST(ast.length ? ast[0] : null);
      else setCurrentAST(ast);
      // TODO: understand why ast can be an array
    } catch (error) {
      setCurrentAST(null);
    }

    refetch({ throwOnError: true })
      .then(r => {
        if (typeof r.data === 'number')
          snackbar.show(`${r.data} row${r.data > 1 ? 's' : ''} affected`);
      })
      .catch(err => {});
  };

  const handleNewRow = () => {
    if (!currentTableName) return;
    navigation.navigate('RowManager', {
      action: 'new',
      databaseName,
      tableName: currentTableName,
    });
  };

  const handleRowPress = (row: Row) => {
    if (!currentTableName)
      return Alert.alert(
        'Query is not editable',
        'Edit of query from multiple table are not supported',
      );

    if (currentAST?.type === 'select') {
      const primaryCols = getPrimaryColumns(tableSchema!);
      const cols: string[] = Array.isArray(currentAST.columns)
        ? currentAST.columns.map(col => col.expr.column)
        : [];

      if (
        currentAST.columns !== '*' &&
        !primaryCols.every(p => cols.find(c => c === p))
      )
        return Alert.alert(
          'Query is not editable',
          'Select at least all primary columns',
        );

      navigation.navigate('RowManager', {
        action: 'edit',
        databaseName,
        tableName: currentTableName,
        row,
      });
    }
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
              style={{ marginVertical: 5 }}
            >
              Execute
            </Button>
          </View>

          {Array.isArray(data) && data.length ? <Table data={data} /> : null}
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default QueryScreen;
