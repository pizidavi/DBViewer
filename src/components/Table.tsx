import React, { useState, useEffect, useMemo } from 'react';
import { useWindowDimensions, FlatList, ScrollView } from 'react-native';
import { DataTable } from 'react-native-paper';

import { getLargestColumnsWidth } from 'utils/utils';

interface TableProps {
  data: Row[];
  onRowPress?: (row: Row) => void;
}

const itemsPerPageList = [5, 10, 20, 30, 50];

/**
 * Component to show a Table
 */
const Table = ({ data, onRowPress }: TableProps) => {
  const window = useWindowDimensions();
  const [columnsWidth, setColumnsWidth] = useState<number[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageList[1]);

  // Get the data for the current page
  const from = useMemo(() => page * itemsPerPage, [page, itemsPerPage]);
  const to = useMemo(
    () => Math.min((page + 1) * itemsPerPage, data.length),
    [page, itemsPerPage, data],
  );
  const dataPerPage = useMemo(() => data.slice(from, to), [data, from, to]);

  // Get the largest width for each column
  useEffect(() => {
    getLargestColumnsWidth(dataPerPage).then(widths => setColumnsWidth(widths));
  }, [dataPerPage]);

  return (
    <>
      <ScrollView horizontal={true} bounces={false}>
        <DataTable>
          <DataTable.Header>
            {Object.keys(data[0]).map((key, index, array) => (
              <DataTable.Title
                key={`${key}-${index}`}
                style={{
                  width: Math.max(
                    columnsWidth[index] ?? 0,
                    window.width / array.length,
                  ),
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
              <DataTable.Row onPress={() => onRowPress?.(item)}>
                {Object.values(item).map((value, index, array) => (
                  <DataTable.Cell
                    key={`${itemIndex}-${index}`}
                    style={{
                      width: Math.max(
                        columnsWidth[index] ?? 0,
                        window.width / array.length,
                      ),
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
