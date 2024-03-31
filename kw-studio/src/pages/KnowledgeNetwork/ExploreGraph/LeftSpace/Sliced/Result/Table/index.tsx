import React, { useState, useEffect } from 'react';
import { Button, Popover, Select, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SelectProps } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { OptionalColumTable, CustomColumns } from '../../../components';

const DEFAULT_COLUMNS_COMMUNITY = [
  {
    title: intl.get('exploreGraph.algorithm.uniqueLabelledAttribute'),
    dataIndex: 'defaultProperty',
    type: 'string',
    fixed: 'left'
  },
  {
    title: intl.get('exploreGraph.algorithm.entityClass'),
    dataIndex: 'classAlias',
    type: 'string',
    fixed: 'left'
  },
  {
    title: 'VID',
    dataIndex: 'id',
    type: 'string'
  }
];

const SELECT_ALL_OPTION = { value: 'all', label: intl.get('exploreGraph.algorithm.all') };

type ItemsType = {
  clusterId: string;
  label: string;
  children: any;
};

const Table = (props: any) => {
  const { dataSource } = props;
  const [optionsNodes, setOptionsNodes] = useState<any>([]); // 实体类选项
  const [selectValue, setSelectValue] = useState('all'); // 实体类筛选控制项
  const [resultDataPart, setResultDataPart] = useState<ItemsType[]>([]); // 图计算结果的筛选后数据
  const [columnsData, setColumnsData] = useState<any>({}); // 全部的可展示属性
  const [extendColumns, setExtendColumns] = useState([]); // 选中的自定义可拓展属性
  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    const columns = CustomColumns.BuildColumnsDataBasedOnNodes(dataSource);
    const tables = OptionalColumTable.BuildSourceDataBasedOnNodes(dataSource);
    setColumnsData(columns);
    setTableData(tables);
    const newOptionsNodes: SelectProps['options'] = [];
    _.forEach(columns, item => {
      newOptionsNodes.push({ value: item.class, label: item.label });
    });
    setOptionsNodes(newOptionsNodes);
  }, []);

  useEffect(() => {
    if (selectValue === 'all') return setResultDataPart([]);
    const newItemsPart = _.filter(tableData, d => d.class === selectValue);
    setResultDataPart(newItemsPart);
  }, [selectValue]);

  // 选择展示属性的回调
  const onChangeColumns = (data: any) => {
    setExtendColumns(data);
  };

  // 结果展示数据
  const _resultData = _.isEmpty(resultDataPart) ? tableData : resultDataPart;

  return (
    <div>
      <div className="kw-space-between kw-pt-4 kw-pb-4">
        <div className="kw-space-between kw-w-100">
          <div style={{ flex: 1, minWidth: 0 }}>
            {intl.get('exploreGraph.algorithm.entityClass')}
            <Select
              className="kw-w-100 kw-ml-2"
              value={selectValue}
              style={{ maxWidth: 300 }}
              options={[SELECT_ALL_OPTION, ...optionsNodes]}
              onChange={(value: string) => setSelectValue(value)}
            />
          </div>

          <Tooltip title={intl.get('exploreGraph.algorithm.tableParameterSetting')}>
            <Popover
              overlayClassName="optionalColumTablePopover"
              trigger="click"
              placement="bottomRight"
              content={<CustomColumns source={columnsData} onChangeColumns={onChangeColumns} />}
              getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
            >
              <Button type="default" className="kw-ml-2" style={{ minWidth: 32, padding: 4, color: '#777' }}>
                <PlusOutlined />
              </Button>
            </Popover>
          </Tooltip>
        </div>
      </div>
      <OptionalColumTable
        dataSource={_resultData}
        extendColumns={extendColumns}
        defaultColumns={DEFAULT_COLUMNS_COMMUNITY}
      />
    </div>
  );
};

export default Table;
