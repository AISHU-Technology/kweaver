import _ from 'lodash';
import intl from 'react-intl-universal';
import { PreviewColumn } from '../types';

/**
 * 将后端预览数据转换为表格数据
 */
export const parseToTable = (list: { content: string[][]; property: string[] }): PreviewColumn[] => {
  const { content = [], property = [] } = list;
  const header = content[0];
  const table: PreviewColumn[] = _.map(header, (th, index) => ({
    key: property[index],
    name: th,
    columns: []
  }));
  _.forEach(content, (rows, index) => {
    if (!index) return;
    _.forEach(rows, (col, i) => table[i].columns.push(col));
  });
  return table;
};

/**
 * 模型spo数据转换成表格数据
 * @param spoList 后端返回的spo数据
 */
export const parseSpo = (spoList: { alias: string; original_name: string }[][]): PreviewColumn[] => {
  const result: PreviewColumn[] = [
    {
      key: intl.get('createEntity.tableTitle1'),
      name: intl.get('createEntity.tableTitle1'),
      columns: []
    },
    {
      key: intl.get('createEntity.tableTitle2'),
      name: intl.get('createEntity.tableTitle2'),
      columns: []
    },
    {
      key: intl.get('createEntity.tableTitle3'),
      name: intl.get('createEntity.tableTitle3'),
      columns: []
    }
  ];

  _.forEach(_.slice(spoList, 1), rows => {
    _.forEach(rows, (item, index) => {
      if (index > result.length - 1) return;
      result[index].columns.push(item.alias);
    });
  });

  return result;
};
