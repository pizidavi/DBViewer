/**
 * TS declaretion of 'json-sql' module
 */
declare module 'json-sql' {
  type Dialect = 'base' | 'mssql' | 'mysql' | 'postgresql' | 'sqlite';
  type QueryTypes =
    | 'select'
    | 'insert'
    | 'update'
    | 'remove'
    | 'union'
    | 'intersect'
    | 'expect';

  type Options = {
    separatedValues?: boolean;
    namedValues?: boolean;
    valuesPrefix?: string;
    dialect?: Dialect;
    wrappedIdentifiers?: boolean;
    indexedValues?: boolean;
  };
  type Values = {
    [key: string]: Values | string | number | null;
  };
  type Query = {
    type: string;
    table: string;
    [key: string]: any;
  };
  type BuildResponse = {
    query: string;
    value?: Values | Values[];
    prefixValues?: () => Values;
    getValuesArray?: () => Values[];
    getValuesValues?: () => Values;
  };
  type Builder = {
    configure: (options?: Options) => void;
    build: (query: Query) => BuildResponse;
    setDialect: (name: Dialect) => void;
  };
  export default function (options?: Options): Builder;
}
