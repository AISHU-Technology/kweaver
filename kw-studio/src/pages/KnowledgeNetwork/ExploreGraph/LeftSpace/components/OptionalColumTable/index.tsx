import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import moment from 'moment';
import { Table } from 'antd';
import classNames from 'classnames';
import VirtualAntdTable from '@/components/VirtualAntdTable';
import { PROPERTIES_TYPE } from '@/enums';
import './style.less';

const formatColumns = (columns: any, option?: any) => {
  return _.map(columns, item => {
    const { type, dataIndex } = item || {};
    const sorter = (a: any, b: any, rule: 'ascend' | 'descend') => {
      const _type = (PROPERTIES_TYPE.SQL_TYPE_TO_JS_TYPE as any)?.[type] || 'string';
      const valueA = a?.[dataIndex];
      const valueB = b?.[dataIndex];
      if (_type === 'date') return moment(valueA).valueOf() - moment(valueB).valueOf();
      if (_type === 'number') {
        // 无法转化为float比较的, 转化为Infinity放到末尾
        const a = isNaN(parseFloat(valueA)) ? (rule === 'ascend' ? +Infinity : -Infinity) : parseFloat(valueA);
        const b = isNaN(parseFloat(valueB)) ? (rule === 'ascend' ? +Infinity : -Infinity) : parseFloat(valueB);
        return a === b ? 0 : a > b ? 1 : -1;
      }
      return String(valueA).localeCompare(String(valueB), 'en');
    };
    const render = (value: any) => value || '--';
    return { ...(option || {}), sorter, render, width: 120, ellipsis: true, ...item };
  });
};

export interface OptionalColumTableProps {
  dataSource: any[];
  extendColumns: any[];
  defaultColumns: any[];
  virtual?: boolean;
  tableProps?: Record<string, any>;
  onRowClick?: any;
}
const OptionalColumTable = (props: OptionalColumTableProps) => {
  const { dataSource, extendColumns, defaultColumns, virtual = false, tableProps = {} } = props;
  const { onRowClick } = props;

  const [columns, setColumns] = useState<{ title: string; dataIndex: string; [key: string]: any }[]>([]);

  useEffect(() => {
    const columns = formatColumns(defaultColumns);
    setColumns(columns);
  }, []);
  useEffect(() => {
    const columnsDefault = formatColumns(defaultColumns);
    const columnsExtend = formatColumns(extendColumns);
    setColumns([...columnsDefault, ...columnsExtend]);
  }, [extendColumns.length]);

  const rowClassName = classNames(tableProps.rowClassName, { tableClickStyle: !!onRowClick });

  return (
    <div className="optionalColumTableRoot">
      {virtual ? (
        <VirtualAntdTable
          {...tableProps}
          rowKey="id"
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          rowClassName={rowClassName}
          onRow={record => {
            const rowEvent: any = {};
            if (onRowClick) rowEvent.onClick = () => onRowClick([record]);
            return rowEvent;
          }}
        />
      ) : (
        <Table
          rowKey="id"
          scroll={columns.length > 4 ? { x: 1000 } : {}}
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          {...tableProps}
          rowClassName={rowClassName}
          onRow={record => {
            const rowEvent: any = {};
            if (onRowClick) rowEvent.onClick = () => onRowClick([record]);
            return rowEvent;
          }}
        />
      )}
    </div>
  );
};

type BuildDataType = {
  id: string;
  class: string;
  showLabels: { key: string; alias: string; type: string; value: string }[];
  default_property: { name: string; [key: string]: string };
  [key: string]: any;
};
const BuildSourceDataBasedOnNodes = (
  nodes: BuildDataType[],
  option?: { extendProperties?: string[]; defaultColumnKeys?: string[] | undefined }
) => {
  const { extendProperties = [], defaultColumnKeys = [] } = option || {};
  const dataSource: any = [];
  _.forEach(nodes, node => {
    const properties: any = {};
    const defaultProperty = node?.default_property?.value;
    _.forEach(node?.showLabels, d => {
      if (d.key === node?.default_property?.name || d.key === 'id') return;
      let key = d?.key?.startsWith('#') ? d.key.slice(1) : d.key;
      if (_.includes([...defaultColumnKeys, ...extendProperties], key)) key = `_${key}`;
      properties[key] = d?.value;
    });
    if (!node?.showLabels) {
      const tag = node.class || node.tag || node.tags?.[0];
      const proMap = _.keyBy(node.properties, 'tag');
      _.forEach(proMap[tag]?.props || node.properties, p => {
        const { name, value } = p;
        if (name === node?.default_property?.name) return;
        if (name === 'id') return;
        let key = name;
        if (_.includes([...defaultColumnKeys, ...extendProperties], name)) key = `_${name}`;
        properties[key] = value;
      });
    }
    const extendObj: any = {};
    if (extendProperties) {
      _.forEach(extendProperties, key => {
        if (node[key]) extendObj[key] = node[key];
      });
    }
    dataSource.push({
      id: node.id,
      defaultProperty,
      class: node?.class,
      classAlias: node?.alias,
      ..._.pick(node, 'sourceLabel', 'targetLabel'),
      ...extendObj,
      ...properties
    });
  });
  return dataSource;
};

OptionalColumTable.BuildSourceDataBasedOnNodes = BuildSourceDataBasedOnNodes;
export default OptionalColumTable;
