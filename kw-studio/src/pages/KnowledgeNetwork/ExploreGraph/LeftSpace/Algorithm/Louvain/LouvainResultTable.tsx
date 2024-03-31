import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Collapse } from 'antd';

import IconFont from '@/components/IconFont';
import { OptionalColumTable } from '../../components';

import './style.less';

const DEFAULT_COLUMNS = [
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
const DEFAULT_COLUMNS_TILE = [
  {
    title: intl.get('exploreGraph.algorithm.communityUpper'),
    dataIndex: 'clusterId',
    width: 80,
    type: 'string',
    fixed: 'left'
  },
  ...DEFAULT_COLUMNS
];
const DEFAULT_COLUMNS_COMMUNITY = DEFAULT_COLUMNS;

const ResultTile = (props: any) => {
  const { items, extendColumns } = props;
  const { onSelectedNodes } = props;
  return (
    <div style={{ width: '100%', height: 'calc(100% - 210px)', overflow: 'hidden', overflowY: 'auto' }}>
      <OptionalColumTable
        dataSource={items}
        extendColumns={extendColumns}
        defaultColumns={DEFAULT_COLUMNS_TILE}
        onRowClick={onSelectedNodes}
      />
    </div>
  );
};

const ResultCommunity = (props: any) => {
  const { items, extendColumns } = props;
  const { onSelectedNodes } = props;
  return (
    <Collapse className="louvainResultCollapse" accordion>
      {_.map(items, item => {
        const { label, clusterId, children } = item;
        const header = (
          <div className="kw-w-100 kw-space-between">
            <div>{label}</div>
            <IconFont
              type="icon-dingwei1"
              onClick={(event: any) => {
                onSelectedNodes(children);
                event.stopPropagation();
                event.nativeEvent.stopImmediatePropagation(); // 可控 Popover, 禁止冒泡
                return false;
              }}
            />
          </div>
        );
        return (
          <Collapse.Panel key={clusterId} header={header}>
            <OptionalColumTable
              dataSource={children}
              extendColumns={extendColumns}
              defaultColumns={DEFAULT_COLUMNS_COMMUNITY}
            />
          </Collapse.Panel>
        );
      })}
    </Collapse>
  );
};

export { ResultTile, ResultCommunity };
