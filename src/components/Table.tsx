import React, { useState, useEffect, useMemo } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { FlatList, ScrollView } from 'react-native';
import { DataTable } from 'react-native-paper';

import { getLargestColumnsWidth } from 'utils/utils';

interface TableProps {
  data: Row[];
  onRowPress?: (event: GestureResponderEvent) => void;
}

const itemsPerPageList = [5, 10, 20, 30, 50];

const Table = ({ data, onRowPress }: TableProps) => {
  const [columnsWidth, setColumnsWidth] = useState<number[]>([]);

  // Table Pagination state
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageList[1]);

  const from = useMemo(() => page * itemsPerPage, [page, itemsPerPage]);
  const to = useMemo(
    () => Math.min((page + 1) * itemsPerPage, data.length),
    [page, itemsPerPage, data],
  );
  const dataPerPage = useMemo(() => data.slice(from, to), [data, from, to]);

  useEffect(() => {
    getLargestColumnsWidth(dataPerPage).then(widths => setColumnsWidth(widths));
  }, [dataPerPage]);

  return (
    <>
      <ScrollView horizontal={true} bounces={false}>
        <DataTable>
          <DataTable.Header>
            {Object.keys(data[0]).map((key, index) => (
              <DataTable.Title
                key={`${key}-${index}`}
                style={{
                  width: columnsWidth[index],
                }}
              >
                {key}
              </DataTable.Title>
            ))}
          </DataTable.Header>

          <FlatList
            data={dataPerPage}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item, index: itemIndex }) => (
              <DataTable.Row onPress={onRowPress}>
                {Object.values(item).map((value, index) => (
                  <DataTable.Cell
                    key={`${itemIndex}-${index}`}
                    style={{
                      width: columnsWidth[index],
                    }}
                  >
                    {String(value)}
                  </DataTable.Cell>
                ))}
              </DataTable.Row>
            )}
            bounces={false}
          />
        </DataTable>
      </ScrollView>

      <DataTable.Pagination
        label={`${from + 1}-${to} of ${data.length}`}
        page={page}
        onPageChange={page => setPage(page)}
        showFastPaginationControls
        numberOfPages={Math.ceil(data.length / itemsPerPage)}
        numberOfItemsPerPageList={itemsPerPageList}
        numberOfItemsPerPage={itemsPerPage}
        onItemsPerPageChange={number => {
          setItemsPerPage(number);
          setPage(0);
        }}
        selectPageDropdownLabel="Rows per page"
      />
    </>
  );
};

export default Table;
