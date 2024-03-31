import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Select, Checkbox } from 'antd';
import type { SelectProps } from 'antd';

import HOOKS from '@/hooks';

import './style.less';

const SELECT_ALL_OPTION = { value: 'all', label: intl.get('exploreGraph.algorithm.all') };
const CustomColumns = (props: any) => {
  const { source } = props;
  const { onChangeColumns } = props;

  const [options, setOptions] = useState<any>([]); // 实体可选择项
  const [selectValue, setSelectValue] = useState('all'); // 实体类筛选控制项
  const [columns, setColumns] = useState<any>([]); // 全部的可展示属性
  const [selected, setSelected] = useState<string[]>([]); // 已选的可展示属性

  useEffect(() => {
    if (selectValue === 'all') return initCustomColumns();

    const newProperties: any = {};
    const data = source[selectValue];
    _.forEach(data.columns, d => {
      const column = { ...d };
      const { dataIndex, type } = column;
      if (newProperties[dataIndex] && newProperties[dataIndex].type !== type) column.type = 'string';
      newProperties[dataIndex] = column;
    });
    setColumns(_.values(newProperties));
  }, [selectValue]);

  HOOKS.useUpdateEffect(() => {
    const callBackData = _.filter(columns, item => _.includes(selected, item.dataIndex));
    onChangeColumns(callBackData);
  }, [selected?.length]);

  /** 初始化数据 */
  const initCustomColumns = () => {
    const newOptions: SelectProps['options'] = [];
    const newProperties: any = {};
    _.forEach(_.values(source), item => {
      newOptions.push({ value: item.class, label: item.label });
      _.forEach(item.columns, d => {
        const column = { ...d };
        const { dataIndex, type } = column;
        if (newProperties[dataIndex] && newProperties[dataIndex].type !== type) column.type = 'string';
        newProperties[dataIndex] = column;
      });
    });
    setOptions(newOptions);
    setColumns(_.values(newProperties));
  };

  /** 选中属性 */
  const onCheckboxChange = (dataIndex: string) => (e: any) => {
    const checked = e.target.checked;
    let newSelected = [...selected];
    if (checked) {
      newSelected.push(dataIndex);
    } else {
      newSelected = _.filter(newSelected, item => item !== dataIndex);
    }
    setSelected(newSelected);
  };

  /** 全选 */
  const onCheckAll = (e: any) => {
    const checked = e.target.checked;
    let newSelected = [];
    if (checked) {
      newSelected = _.map(columns, item => item.dataIndex);
    } else {
      newSelected = [];
    }
    setSelected(newSelected);
  };

  const isAllSelected = selected?.length > 0 && columns?.length > 0 && selected?.length === columns?.length;
  const isIndeterminate = selected?.length > 0 && !isAllSelected;

  return (
    <div
      className="customColumnsRoot"
      onClick={(event: any) => {
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation(); // 可控 Popover, 禁止冒泡
        return false;
      }}
    >
      <div style={{ padding: '4px 16px' }}>
        <Select
          value={selectValue}
          options={[SELECT_ALL_OPTION, ...options]}
          onChange={(value: string) => setSelectValue(value)}
        />
      </div>
      <div style={{ padding: '4px 16px' }}>
        <Checkbox checked={isAllSelected} indeterminate={isIndeterminate} onChange={onCheckAll}>
          全部
        </Checkbox>
      </div>
      <div style={{ maxHeight: 330, overflowY: 'auto' }}>
        {_.map(columns, d => {
          const { title, dataIndex } = d;
          const checked = _.includes(selected, dataIndex);
          return (
            <div key={dataIndex} className="columnsClassify">
              <Checkbox checked={checked} onChange={onCheckboxChange(dataIndex)}>
                {title}
              </Checkbox>
            </div>
          );
        })}
      </div>
    </div>
  );
};

type BuildDataType = {
  class: string;
  alias: string;
  showLabels: { key: string; alias: string; type: string }[];
  default_property: { name: string; [key: string]: string };
  [key: string]: any;
};
const BuildColumnsDataBasedOnNodes = (
  nodes: BuildDataType[],
  option?: { defaultColumnKeys?: string[] | undefined }
) => {
  const newColumns: any = {};
  const { defaultColumnKeys = [] } = option || {};
  _.forEach(nodes, node => {
    const columns: any = [];
    _.forEach(node?.showLabels, d => {
      const { key, type, alias } = d;
      if (d.key === node?.default_property?.name) return;
      const isSpecialKey = d?.key?.startsWith('#');

      let dataIndex = isSpecialKey ? d.key.slice(1) : d.key;
      if (['id', 'entity_class', 'edge_class'].includes(dataIndex)) return;
      if (_.includes(defaultColumnKeys || [], key)) dataIndex = `_${key}`;
      const column = { dataIndex, title: isSpecialKey ? dataIndex : alias, type: type || 'string', isCheckout: false };
      columns.push(column);
    });
    if (!node?.showLabels) {
      const tag = node.class || node.tag || node.tags?.[0];
      const proMap = _.keyBy(node.properties, 'tag');
      const properties = proMap[tag]?.props || node.properties;
      _.forEach(properties, p => {
        const { name, alias, value, type } = p;
        if (name === node?.default_property?.name) return;
        if (name === 'id') return;
        let dataIndex = name;
        if (_.includes(defaultColumnKeys || [], name)) dataIndex = `_${name}`;
        const column = {
          dataIndex,
          title: alias,
          type: type || 'string',
          isCheckout: false
        };
        columns.push(column);
      });
    }
    newColumns[node.class] = {
      class: node.class,
      label: node?.alias,
      columns
    };
  });
  return newColumns;
};

CustomColumns.BuildColumnsDataBasedOnNodes = BuildColumnsDataBasedOnNodes;
export default CustomColumns;
