import React, { useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';

import HOOKS from '@/hooks';
import { OptionalColumTable } from '../../components';

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
    title: intl.get('exploreGraph.algorithm.pageRankValue'),
    dataIndex: 'pageRank',
    width: 120,
    type: 'string',
    fixed: 'left'
  },
  ...DEFAULT_COLUMNS
];

const PageRankTable = (props: any) => {
  const { items, extendColumns, statisticsHeight } = props;
  const { onSelectedNodes } = props;

  const domRef = useRef<HTMLDivElement>(null);
  const { height: domHeight } = HOOKS.useSize(domRef);

  return (
    <div ref={domRef} style={{ width: '100%', height: `calc(100% - ${190 + statisticsHeight}px)` }}>
      <OptionalColumTable
        dataSource={items}
        extendColumns={extendColumns}
        defaultColumns={DEFAULT_COLUMNS_TILE}
        onRowClick={onSelectedNodes}
        tableProps={{
          scroll: { y: domHeight }
        }}
      />
    </div>
  );
};

export default PageRankTable;
