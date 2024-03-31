import intl from 'react-intl-universal';
const MYSQL = 'mysql';
const HIVE = 'hive';
const ODBC = 'odbc';
const SQLSERVER = 'odbc-sqlserver';
const KINGBASEES = 'odbc-kingbasees';
const KINGBASE = 'kingbasees';
const POSTGRESQL = 'postgresql';
const MYSQLODBC = 'odbc-mysql';
const CLICKHOUSE = 'clickhouse';

export const defaultOption = [
  {
    id: MYSQL,
    value: MYSQL,
    label: 'MySQL'
  },
  {
    id: HIVE,
    value: HIVE,
    label: 'Hive'
  },
  {
    id: CLICKHOUSE,
    value: CLICKHOUSE,
    label: 'ClickHouse'
  },
  {
    id: POSTGRESQL,
    value: POSTGRESQL,
    label: `PostgreSQL ${intl.get('datamanagement.pgSql')}`
  },
  {
    id: KINGBASE,
    value: KINGBASE,
    label: `KingbaseES ${intl.get('datamanagement.king')}`
  },

  {
    id: ODBC,
    value: ODBC,
    label: 'ODBC'
  }
];
export const odbc = [
  {
    id: SQLSERVER,
    value: SQLSERVER,
    label: 'SQLServer (ODBC)'
  },
  {
    id: KINGBASEES,
    value: KINGBASEES,
    label: `KingbaseES (${intl.get('datamanagement.versionTip')})`
  },
  {
    id: MYSQLODBC,
    value: MYSQLODBC,
    label: 'MySQL (ODBC)'
  }
];

export const ERROR_CODE: Record<string, any> = {
  'Manager.SoftAuth.UnknownServiceRecordError': intl.get('datamanagement.notAuth'),
  'Manager.Graph.AddDefaultPermissionError': intl.get('datamanagement.addAuthError')
};
