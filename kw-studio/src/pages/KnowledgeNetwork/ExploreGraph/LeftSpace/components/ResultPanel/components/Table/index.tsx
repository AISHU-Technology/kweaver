import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button, Popover, Select, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SelectProps } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import _ from 'lodash';
import HOOKS from '@/hooks';
import { OptionalColumTable, CustomColumns } from '../../../';
import './style.less';

const NODES_DEFAULT_COLUMNS = [
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

const EDGES_DEFAULT_COLUMNS = [
  {
    title: intl.get('createEntity.startPoint'),
    dataIndex: 'sourceLabel',
    type: 'string',
    fixed: 'left'
  },
  {
    title: intl.get('createEntity.endPoint'),
    dataIndex: 'targetLabel',
    type: 'string',
    fixed: 'left'
  },
  {
    title: intl.get('exploreGraph.relationClass'),
    dataIndex: 'classAlias',
    type: 'string'
  }
];
const SELECT_ALL_OPTION = { value: 'all', label: intl.get('exploreGraph.algorithm.all') };

type ItemsType = {
  clusterId: string;
  label: string;
  children: any;
};

export interface ResTableProps {
  className?: string;
  style?: React.CSSProperties;
  type?: 'nodes' | 'edges' | string;
  height?: number; // 虚拟滚动高度
  dataSource: any[]; // 渲染数据
  checkable?: boolean; // 是否显示可勾选
  checkedKeys: string[]; // 勾选的key
  disabledKeys: string[]; // 禁用的key
  onCheckChange?: (keys: string[]) => void; // 勾选的回调
}

const Table = (props: ResTableProps) => {
  const {
    className,
    style,
    type = 'nodes',
    height,
    dataSource,
    checkable,
    checkedKeys,
    disabledKeys,
    onCheckChange
  } = props;
  const domRef = useRef<HTMLDivElement>(null);
  const [optionsNodes, setOptionsNodes] = useState<any>([]); // 实体类选项
  const [selectValue, setSelectValue] = useState('all'); // 实体类筛选控制项
  const [resultDataPart, setResultDataPart] = useState<ItemsType[]>([]); // 图计算结果的筛选后数据
  const [columnsData, setColumnsData] = useState<any>({}); // 全部的可展示属性
  const [extendColumns, setExtendColumns] = useState([]); // 选中的自定义可拓展属性
  const [tableData, setTableData] = useState<any[]>([]);
  const { height: domHeight } = HOOKS.useSize(domRef);

  // 有复选框时减少默认列宽度
  const defaultColumns = useMemo(() => {
    const col = type === 'edges' ? EDGES_DEFAULT_COLUMNS : NODES_DEFAULT_COLUMNS;
    return checkable ? _.map(col, item => ({ ...item, width: 110 })) : col;
  }, [type, checkable]);

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

  /**
   * 全选
   */
  const onCheckAll = (isCheck: boolean, keys: string[]) => {
    onCheckChange?.(keys);
  };

  const rowSelection = checkable
    ? {
        fixed: true,
        type: 'checkbox',
        selectedRowKeys: checkedKeys,
        onSelectAll: onCheckAll,
        onChange: onCheckChange,
        getCheckboxProps: ({ id }: any) => ({ disabled: _.includes(disabledKeys, id) })
      }
    : undefined;

  // 结果展示数据
  const _resultData = _.isEmpty(resultDataPart) ? tableData : resultDataPart;

  return (
    <div ref={domRef} className={classNames('canvas-res-panel-table kw-h-100', className)} style={style}>
      <div className="kw-space-between kw-w-100 kw-pb-4">
        <div className="kw-align-center" style={{ flex: 1, minWidth: 0 }}>
          <span>
            {type === 'edges' ? intl.get('exploreGraph.relationClass') : intl.get('exploreGraph.algorithm.entityClass')}
          </span>
          <Select
            className="kw-w-100 kw-ml-2"
            value={selectValue}
            style={{ flex: 1, minWidth: 0, maxWidth: 300 }}
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
      <OptionalColumTable
        dataSource={_resultData}
        extendColumns={extendColumns}
        defaultColumns={defaultColumns}
        virtual={dataSource.length > 100}
        tableProps={{
          scroll: { y: height || domHeight - 48 * 2, x: '100%' },
          rowSelection
        }}
      />
    </div>
  );
};

export default Table;
