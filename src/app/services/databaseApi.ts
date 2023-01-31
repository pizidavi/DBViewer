import MySqlConnector from 'lib/MySqlConnector';

export const {
  connect,
  close: disconnect,
  execute,
  executeQuery,
  executeUpdate,
} = MySqlConnector;

/**
 * Use a database
 * @param name Database name
 */
export const useDatabase = (name: string) =>
  MySqlConnector.execute<void>(`USE \`${name}\`;`);

/**
 * Get the list of databases
 * @returns List of databases
 */
export const getDatabases = (): Promise<Database[]> =>
  MySqlConnector.executeQuery<{ SCHEMA_NAME: string }[]>(
    `SHOW DATABASES;`,
  ).then(response =>
    response.map(item => ({
      name: item.SCHEMA_NAME,
    })),
  );

/**
 * Get the list of tables in a database
 * @returns List of tables
 */
export const getTables = (): Promise<Table[]> =>
  MySqlConnector.executeQuery<{ TABLE_NAME: string }[]>(`SHOW TABLES;`).then(
    response =>
      response.map(item => ({
        name: item.TABLE_NAME,
      })),
  );

/**
 * Get the columns information schema of a table
 * @param databaseName Database name
 * @param tableName Table name
 * @returns List of columns
 * @see https://dev.mysql.com/doc/refman/8.0/en/information-schema-columns-table.html
 */
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
      default: parseColumnDefault(item.COLUMN_DEFAULT),
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

/**
 * Get all the columns of a row
 * @param tableName Table name
 * @param primaryKeys Primary keys of the row
 * @returns Row
 */
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

/**
 * Parse a Column to a Row with default values
 * @param columns Columns
 * @returns Row
 */
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

/**
 * Get the primary keys of a table
 * @param schema Table schema
 * @returns Primary keys
 */
export const getPrimaryColumns = (schema: Column[]): string[] => {
  const primaryColumns: string[] = [];
  schema.forEach(column => {
    if (column.key === 'PRI') primaryColumns.push(column.name);
  });
  return primaryColumns;
};

/**
 * Get the data type of a column
 * @param columnName Column name
 * @param schema Table schema
 * @returns ('boolean', 'number', 'string')
 */
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
    : 'string';
};

/**
 * Check if the SQL data type is a JS string
 * @param s SQL data type
 * @returns True if the SQL data type is a JS string
 */
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

/**
 * Check if the SQL data type is a JS number
 * @param s SQL data type
 * @returns True if the SQL data type is a JS number
 */
export function isNumber(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'bit':
    case 'tinyint':
    case 'smallint':
    case 'mediumint':
    case 'int':
    case 'integer':
    case 'bigint':
    // decimal types
    case 'float':
    case 'double':
    case 'dec':
    case 'decimal':
      return true;
    default:
      return false;
  }
}

/**
 * Check if the SQL data type is decimal
 * @param s SQL data type
 * @returns True if the SQL data type is decimal
 */
export function isDecimal(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'float':
    case 'double':
    case 'dec':
    case 'decimal':
      return true;
    default:
      return false;
  }
}

/**
 * Check if the SQL data type is a JS boolean
 * @param s SQL data type
 * @returns True if the SQL data type is a JS boolean
 */
export function isBoolean(s: string): boolean {
  switch (s.toLowerCase()) {
    case 'bool':
    case 'boolean':
      return true;
    default:
      return false;
  }
}

/**
 * Check if a column is nullable
 * @param s 'YES' or 'NO'
 * @returns True if the column is nullable
 */
function isNullable(s: string): boolean {
  return s.toLowerCase() === 'yes';
}

/**
 * Parse the default value of a column
 * @param s Default value
 * @returns Parsed default value
 */
function parseColumnDefault(s: string | null): string | null {
  return !s
    ? s
    : s === 'NULL'
    ? null
    : s?.replace(/^('|")/, '').replace(/('|")$/, '');
}
