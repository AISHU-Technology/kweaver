import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';

import { GraphStoreFace } from '@/hooks/useGraph/GraphStore';
import { BaseTreeGraph } from '@/hooks/useGraph/BaseGraph';

import { SourceType } from '../type';
import { constructGraphTreeData } from './constructGraphData';
import templateDataAssetInventory from './registerItems/templateDataAssetInventory';

import './style.less';

interface GraphStyle {
  edge: any;
  node: any;
  more: any;
}
interface GraphContainerProps {
  graphInstance: GraphStoreFace;
  sourceData: SourceType;
  graphStyle: GraphStyle;
}

const GraphContainer = (props: GraphContainerProps) => {
  const { graphInstance, sourceData, graphStyle } = props;

  const container = useRef<any>(null);

  useEffect(() => {
    if (!container.current) return;
    templateDataAssetInventory('templateDataAssetInventory');
    const graph = new BaseTreeGraph({
      container: container.current,
      modes: {
        default: [
          'drag-canvas',
          'zoom-canvas',
          {
            type: 'collapse-expand',
            shouldBegin: (ev: any) => {
              if (ev?.target?.cfg?.name !== 'tree-badge') return false;
              return true;
            },
            onChange: (item: any, collapsed: any) => {
              const model = item.getModel();
              const newSourceData = model._sourceData;
              if (collapsed) {
                item.update({ _sourceData: { ...newSourceData, treeBadgeIcon: 'plus' } });
              }
              if (!collapsed) {
                item.update({ _sourceData: { ...newSourceData, treeBadgeIcon: 'reduce' } });
              }
            }
          }
        ]
      },
      defaultNode: {
        type: 'templateDataAssetInventory',
        anchorPoints: [
          [1, 0.5],
          [0, 0.5]
        ]
      },
      defaultEdge: { type: 'cubic-horizontal', style: { stroke: 'rgba(0,0,0,0.1)' } },
      layout: {
        type: 'compactBox',
        direction: 'LR',
        getId: (d: any) => d.id,
        getHGap: () => {
          return 90;
        },
        getVGap: (item: any) => {
          // const offset = 30;
          // let height = item?._height;
          // if (_.isEmpty(item.children)) return height - offset;
          // _.forEach(item.children, child => {
          //   height = Math.max(height, child._height);
          // });
          // return height - offset;
          return 16;
        },
        getWidth: (item: any) => {
          return item._layoutWidth || 50;
        },
        getHeight: (item: any) => {
          let height = item?._height;
          if (_.isEmpty(item.children)) return height;
          _.forEach(item.children, child => {
            height = Math.max(height, child._height);
          });
          return height;
        }
      }
    });

    graph.data({ id: 'groupTreeNodeTemp', type: 'circle', isTemp: true, children: [] });
    graph.render();
    graph.fitView();

    const root = graph.findById('groupTreeNodeTemp');
    graph.removeItem(root);

    graph.on('afterlayout', () => {
      graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' }, { easing: 'easeCubic', duration: 400 });
      graph.fitCenter({ easing: 'easeCubic', duration: 400 });
    });

    /** 初始化图谱实例 */
    graphInstance.init({ graph });
  }, [container.current]);

  useEffect(() => {
    const graphData = constructGraphTreeData(sourceData, { graphStyle });
    const { result } = graphData;
    if (_.isEmpty(result)) return;
    graphInstance.changeData(result);
  }, [JSON.stringify(sourceData)]);

  return (
    <div className="graphContainerRoot">
      <div ref={container} className="graphContainer" />
    </div>
  );
};

export default React.memo((props: GraphContainerProps) => {
  if (props?.sourceData?.nodes.length < 1) return null;

  return <GraphContainer {...props} />;
});
