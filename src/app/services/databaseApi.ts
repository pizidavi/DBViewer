import MySqlConnector from 'lib/MySqlConnector';

export const {
  connect,
  close: disconnect,
  execute,
  executeQuery,
  executeUpdate,
} = MySqlConnector;

export const useDatabase = (name: string) =>
  MySqlConnector.execute<void>(`USE \`${name}\`;`);

export const getDatabases = (): Promise<Database[]> =>
  MySqlConnector.executeQuery<{ SCHEMA_NAME: string }[]>(
    `SHOW DATABASES;`,
  ).then(response =>
    response.map(item => ({
      name: item.SCHEMA_NAME,
    })),
  );

export const getTables = (): Promise<Table[]> =>
  MySqlConnector.executeQuery<{ TABLE_NAME: string }[]>(`SHOW TABLES;`).then(
    response =>
      response.map(item => ({
        name: item.TABLE_NAME,
      })),
  );

export const getTableColumnsInformationSchema = (
  databaseName: string,
  tableName: string,
): Promise<Column[]> =>
  MySqlConnector.executeQuery<any[]>(
    `SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '${databaseName}' and TABLE_NAME = '${tableName}' ORDER BY ORDINAL_POSITION ASC;`,
  ).then(response =>
    response.map(item => ({
      key: item.COLUMN_KEY,
      name: item.COLUMN_NAME,
      comment: item.COLUMN_COMMENT,
      default:
        item.COLUMN_DEFAULT === 'NULL'
          ? null
          : item.COLUMN_DEFAULT?.replace(/^('|")/, '').replace(/('|")$/, ''),
      type: item.COLUMN_TYPE,
      data_type: item.DATA_TYPE,
      is_nullable: isNullable(item.IS_NULLABLE),
      ordinal_position: item.ORDINAL_POSITION
        ? parseInt(item.ORDINAL_POSITION)
        : null,
      character_maximum_length: item.CHARACTER_MAXIMUM_LENGTH
        ? parseInt(item.CHARACTER_MAXIMUM_LENGTH)
        : null,
      character_octet_length: item.CHARACTER_OCTET_LENGTH
        ? parseInt(item.CHARACTER_OCTET_LENGTH)
        : null,
    })),
  );

export const getRow = (
  tableName: string,
  primaryKeys: { name: string; value: string | number | null }[],
): Promise<Row | null> =>
  MySqlConnector.executeQuery<Row[]>(
    `SELECT * FROM ${tableName} WHERE ${primaryKeys
      .map(
        ({ name, value }) =>
          `${name}=${
            typeof value === 'string'
              ? `'${value.replace(/'/g, "\\'")}'`
              : value
          }`,
      )
      .join(' and ')} ;`,
  ).then(response => (response.length ? response[0] : null));

// Utils
export const columnsSchemaToRow = (columns: Column[] | undefined): Row => {
  const row: Row = {};
  columns?.forEach(column => {
    row[column.name] =
      column.default === null && column.is_nullable
        ? null
        : column.default ?? '';
  });
  return row;
};

export const getPrimaryColumns = (schema: Column[]): string[] => {
  const primaryColumns: string[] = [];
  schema.forEach(column => {
    if (column.key === 'PRI') primaryColumns.push(column.name);
  });
  return primaryColumns;
};

export const getColumnDataTypeFromSchema = (
  columnName: string,
  schema: Column[],
): string => {
  const column = schema.find(c => c.name === columnName);
  if (column === undefined)
    throw new Error('Column not found in the given Schema');
  return isBoolean(column.data_type)
    ? 'boolean'
    : isNumber(column.data_type)
    ? 'number'
    : isString(column.data_type)
    ? 'string'
    : 'string'; // TODO: Add 'datetime' data type as string
};

export function isString(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'char':
    case 'varchar':
    case 'tinytext':
    case 'text':
    case 'mediumtext':
    case 'longtext':
      return true;
    default:
      return false;
  }
}

export function isNumber(s: string): boolean {
  return isInteger(s) || isFloat(s) || isDouble(s) || isDecimal(s);
}

export function isBoolean(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'bool':
    case 'boolean':
      return true;
    default:
      return false;
  }
}

function isInteger(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'bit':
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'bigint':
      return true;
    default:
      return false;
  }
}

function isFloat(s: string): boolean {
  return s.toLowerCase() === 'float';
}

function isDouble(s: string): boolean {
  return s.toLowerCase() === 'double';
}

function isDecimal(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'dec':
    case 'decimal':
      return true;
    default:
      return false;
  }
}

function isNullable(s: string): boolean {
  return s.toLowerCase() === 'yes';
}
