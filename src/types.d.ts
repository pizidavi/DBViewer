export {};

declare global {
  type Server = {
    id: string;
    name: string;
    host: string;
    port: string | number;
    username: string;
    password: string;
  };
  type Database = {
    name: string;
  };
  type Table = {
    name: string;
  };
  type Row = {
    [key: string]: string | number | null;
  };
  type Column = {
    key: string;
    name: string;
    comment: string | null;
    default: string | number | null;
    type: string;
    data_type: string;
    is_nullable: boolean;
    ordinal_position: number | null;
    character_maximum_length: number | null;
    character_octet_length: number | null;
  };
}
