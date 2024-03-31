import React from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import { ClearOutlined } from '@ant-design/icons';

import Format from '@/components/Format';

import './style.less';

const DisplayIcon = (props: any) => {
  const { selectedItem } = props;
  const { onChangeData } = props;

  const clearIcon = () => {
    const oldNodes = _.cloneDeep(selectedItem?.graphData?.nodes);
    const newNodes = _.map(selectedItem?.graphData?.nodes, (item: any) => ({ ...item, icon: 'empty' }));
    onChangeData({ type: 'graphData', data: { nodes: newNodes, edges: selectedItem?.graphData?.edges } });
    selectedItem?.graph?.current.graphStack.getRedoStack()?.clear();
    selectedItem?.graph?.current.graphStack.pushStack('update', {
      before: { nodes: oldNodes, edges: [] },
      after: { nodes: newNodes, edges: [] }
    });
  };

  return (
    <div className="displayIconRoot">
      <Format.Text>{intl.get('exploreGraph.style.iconL')}</Format.Text>
      <div className="kw-mt-2">
        <Button onClick={clearIcon}>
          <ClearOutlined />
          {intl.get('exploreGraph.style.clearIcon')}
        </Button>
      </div>
    </div>
  );
};

export default DisplayIcon;
