import React from 'react';
import { Collapse } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import IconFont from '@/components/IconFont';
import Table from './Table';
import Path from './Path';
import SubGraph from './SubGraph';
import ErrorTip from '../ErrorTip';
import './style.less';

const Result = (props: any) => {
  const { selectedItem, data, onChangeData } = props;

  // 选中图谱中的元素
  const onSelect = (nodes: any[], edges: any[]) => {
    const nodesKV = _.keyBy(nodes, d => d.id || d);
    const edgesKV = _.keyBy(edges, d => d.id || d);
    const selected: any = { nodes: [], edges: [] };
    _.forEach(selectedItem.graph?.current?.getNodes(), item => {
      if (nodesKV?.[item?._cfg?.id]) {
        item.show();
        selected.nodes.push(item);
      }
    });
    _.forEach(selectedItem.graph?.current?.getEdges(), item => {
      if (edgesKV?.[item?._cfg?.id]) {
        item.show();
        selected.edges.push(item);
      }
    });
    onChangeData({ type: 'selected', data: { ...selected, length: selected.nodes.length + selected.edges.length } });
    const centerNode = selected.nodes[Math.floor(selected.nodes.length / 2)];
    centerNode &&
      selectedItem.graph.current.focusItem(centerNode, true, {
        easing: 'easeCubic',
        duration: 800
      });
  };

  return (
    <div className="slice-result-panel">
      <Collapse
        className="slice-result-collapse"
        accordion
        defaultActiveKey={data.length < 2 ? data[0]?.id : undefined}
      >
        {_.map(data, item => {
          const { id, name, nodesDetail, slicedType, nodes, edges, hasDeleted } = item;
          return (
            <Collapse.Panel
              key={id}
              header={
                <div className="panel-header kw-space-between">
                  <div className="p-name kw-ellipsis">{name}</div>
                  {hasDeleted && <ErrorTip className="kw-ml-2" />}
                  <IconFont
                    className="kw-ml-2"
                    type="icon-dingwei1"
                    onClick={(event: any) => {
                      onSelect(nodes, edges);
                      event.stopPropagation();
                      event.nativeEvent.stopImmediatePropagation();
                      return false;
                    }}
                  />
                </div>
              }
            >
              {/* {slicedType === 'path' && <Path data={item} onSelect={onSelect} />} */}
              {slicedType === 'subgraph' ? <SubGraph data={item} /> : <Table dataSource={nodesDetail} />}
            </Collapse.Panel>
          );
        })}
      </Collapse>
    </div>
  );
};

export default Result;
