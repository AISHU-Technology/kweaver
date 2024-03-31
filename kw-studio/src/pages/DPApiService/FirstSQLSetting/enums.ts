import hiveImg from '@/assets/images/hive.svg';
import mysqlImg from '@/assets/images/mysql.svg';
import sqlServerImg from '@/assets/images/SQLServer.svg';
import kingBaseImg from '@/assets/images/kingbase.svg';
import postGreImg from '@/assets/images/postgreSQL.svg';
import clickhouseImg from '@/assets/images/clickhouse.svg';
const SHEET = 'sheet'; // 表
const MODE = 'mode'; // 模式
const FIELD = 'field'; // 字段
const BASE = 'base'; // 库
const ROOT = 'root'; // 数据源

const SHOW_SQL = 'sql';
const SHOW_TABLE = 'showTable';
// 数据查询展示类型
export const DATA_SOURCE = ['mysql'];

// 节点类型
export const NODE_TYPE = { SHEET, MODE, FIELD, BASE, ROOT };

// 内容区域展示
export const CONTENT_TYPE = { SHOW_SQL, SHOW_TABLE };

export const DATA_SOURCES: Record<string, any> = {
  mysql: mysqlImg,
  hive: hiveImg,
  postgresql: postGreImg,
  kingbasees: kingBaseImg,
  clickhouse: clickhouseImg,
  'sqlserver-odbc': sqlServerImg,
  'kingbasees-odbc': kingBaseImg,
  'mysql-odbc': mysqlImg
};

export const TreeWrapperHeight = 650;
