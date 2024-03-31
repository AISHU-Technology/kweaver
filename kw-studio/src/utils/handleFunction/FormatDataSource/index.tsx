import intl from 'react-intl-universal';
import hiveImg from '@/assets/images/hive.svg';
import mysqlImg from '@/assets/images/mysql.svg';
import mqImg from '@/assets/images/rabbitmq.svg';
import sqlServerImg from '@/assets/images/SQLServer.svg';
import kingBaseImg from '@/assets/images/kingbase.svg';
import postGreImg from '@/assets/images/postgreSQL.svg';
import clickhouseImg from '@/assets/images/clickhouse.svg';

/**
 * 匹配数据源图标和文字
 * @param type 数据源类型
 * @returns
 */
export const formatDataSource = (type: string) => {
  switch (type) {
    case 'mysql':
      return { icon: mysqlImg, text: 'MySQL' };
    case 'hive':
      return { icon: hiveImg, text: 'Hive' };
    case 'rabbitmq':
      return { icon: mqImg, text: 'RabbitMQ' };
    case 'kingbasees':
      return { icon: kingBaseImg, text: `KingbaseES${intl.get('datamanagement.king')} ` };
    case 'postgresql':
      return { icon: postGreImg, text: `PostgreSQL${intl.get('datamanagement.pgSql')}` };
    case 'clickhouse':
      return { icon: clickhouseImg, text: 'ClickHouse' };
    case 'as7-structured':
      return { icon: '', text: `AnyShare 7-${intl.get('datamanagement.structured')}` };
    case 'as7-unstructured':
      return { icon: '', text: `AnyShare 7-${intl.get('datamanagement.unstructured')}` };
    case 'AnyRobot':
      return { icon: '', text: 'AnyRobot' };
    case 'sqlserver-odbc':
      return { icon: sqlServerImg, text: 'SQLServer (ODBC)' };
    case 'kingbasees-odbc':
      return { icon: kingBaseImg, text: `KingbaseES(${intl.get('datamanagement.versionTip')}) ` };
    case 'mysql-odbc':
      return { icon: mysqlImg, text: 'MySQL (ODBC)' };
    default:
      return '';
  }
};
