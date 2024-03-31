import _ from 'lodash';
import { DS_SOURCE } from '@/enums';
import { DsSourceItem } from '../types';

import hiveImg from '@/assets/images/hive.svg';
import mqImg from '@/assets/images/rabbitmq.svg';
import mysqlImg from '@/assets/images/CocoaMySQL.svg';
import sqlServerImg from '@/assets/images/SQLServer.svg';
import kingbaseImg from '@/assets/images/kingbase.svg';
import postgreImg from '@/assets/images/postgreSQL.svg';
import clickhouse from '@/assets/images/clickhouse.svg';

/**
 * 将数据源 按 抽取方式分类
 * @param sourceList 后端返回的数据源列表
 */
export const classifySource = (sourceList: DsSourceItem[]) => {
  return _.reduce(
    sourceList,
    (res, item) => {
      if (res[item.extract_type]) {
        res[item.extract_type].push(item);
      } else {
        res[item.extract_type] = [item];
      }
      return res;
    },
    {} as Record<string, DsSourceItem[]>
  );
};

/**
 * 数据源图片映射
 */
export const SOURCE_IMG_MAP = {
  [DS_SOURCE.as]: '',
  [DS_SOURCE.mysql]: mysqlImg,
  [DS_SOURCE.hive]: hiveImg,
  [DS_SOURCE.mq]: mqImg,
  [DS_SOURCE.sqlserver]: sqlServerImg,
  [DS_SOURCE.kingbasees]: kingbaseImg,
  [DS_SOURCE.postgresql]: postgreImg,
  [DS_SOURCE.clickhouse]: clickhouse,
  [DS_SOURCE.AnyRobot]: ''
};
