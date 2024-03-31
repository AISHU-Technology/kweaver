import intl from 'react-intl-universal';
const MYSQL = 'mysql';
const HIVE = 'hive';
const KINGBASE = 'kingbasees';
const POSTGRESQL = 'postgresql';
const CLICKHOUSE = 'clickhouse';

export const defaultOption = [
  {
    id: MYSQL,
    value: MYSQL,
    label: 'MySQL'
  }
];

export const ERROR_CODE: Record<string, any> = {
  'Manager.SoftAuth.UnknownServiceRecordError': intl.get('datamanagement.notAuth'),
  'Manager.Graph.AddDefaultPermissionError': intl.get('datamanagement.addAuthError')
};
