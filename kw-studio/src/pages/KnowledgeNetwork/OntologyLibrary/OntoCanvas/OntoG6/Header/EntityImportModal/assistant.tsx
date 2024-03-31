import _ from 'lodash';
import { DS_SOURCE } from '@/enums';

import hiveImg from '@/assets/images/hive.svg';
import mqImg from '@/assets/images/rabbitmq.svg';
import mysqlImg from '@/assets/images/CocoaMySQL.svg';
import sqlServerImg from '@/assets/images/SQLServer.svg';
import kingbaseImg from '@/assets/images/kingbase.svg';
import postgreImg from '@/assets/images/postgreSQL.svg';
import clickhouseImg from '@/assets/images/clickhouse.svg';

/**
 * 数据源图片映射
 */
export const ONTO_SOURCE_IMG_MAP = {
  [DS_SOURCE.as]: '',
  [DS_SOURCE.mysql]: mysqlImg,
  [DS_SOURCE.hive]: hiveImg,
  [DS_SOURCE.mq]: mqImg,
  [DS_SOURCE.kingbasees]: kingbaseImg,
  [DS_SOURCE.sqlserver]: sqlServerImg,
  [DS_SOURCE.postgresql]: postgreImg,
  [DS_SOURCE.clickhouse]: clickhouseImg,
  [DS_SOURCE.AnyRobot]: ''
};
