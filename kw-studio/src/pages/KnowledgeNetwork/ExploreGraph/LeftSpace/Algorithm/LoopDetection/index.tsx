import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import './style.less';
import { LeftDrawerTitle } from '../../components';
import classNames from 'classnames';
import { MoreOutlined } from '@ant-design/icons';
import type { Graph as IGraph, INode, IEdge, NodeConfig } from '@antv/g6';
import IconFont from '@/components/IconFont';
import intl from 'react-intl-universal';
import NoDataBox from '@/components/NoDataBox';
import _ from 'lodash';

export interface LoopDetectionDataProps {
  [key: string]: NodeConfig;
}

interface LoopDetectionProps {
  selectedTabItem?: any; // 选中的tab页签
  onGoBack?: () => void; // 返回上一层菜单
  onCloseLeftDrawer?: () => void; // 关闭侧边栏
  detectAllCycles?: () => boolean; // 检测所有的环
  loopDetectionData?: LoopDetectionDataProps[]; // 检测出来的环数据
  onChangeData: (data: { type: string; data: any }) => void;
}

interface ItemDataProps {
  nodes: INode[];
  edges: IEdge[];
}

/**
 * 环检测组件
 * @param props
 * @constructor
 */
const LoopDetection: React.FC<PropsWithChildren<LoopDetectionProps>> = props => {
  const { selectedTabItem, onGoBack, onCloseLeftDrawer, detectAllCycles, loopDetectionData, onChangeData } = props;

  const graph: IGraph = selectedTabItem?.graph?.current; // 获取图谱的实例

  const [itemData, setItemData] = useState<ItemDataProps>({
    nodes: [],
    edges: []
  });
  const isMounted = useRef<boolean>(false); // 防止空数据闪烁的问题
  const currentCycleIndex = useRef<number>(0); // 当前环的索引
  const cacheLastloopDetectionData = useRef<LoopDetectionDataProps[]>([]); // 缓存上一次的loopDetectionData

  useEffect(() => {
    if (loopDetectionData && loopDetectionData.length > 0) {
      handleItemData();
    }

    return () => {
      clearStatus();
      cacheLastloopDetectionData.current = loopDetectionData!;
    };
  }, [loopDetectionData]);

  /**
   * 清除环的状态
   */
  const clearStatus = () => {
    // 切换布局的时候，graph图会被destroyed
    if (!graph.destroyed) {
      const selectedNodes = selectedTabItem.selected?.nodes ?? [];
      const selectedEdges = selectedTabItem.selected?.edges ?? [];
      [...selectedEdges, ...selectedNodes].forEach(item => {
        if (item._cfg) {
          graph.clearItemStates(item);
        }
      });
    }
    setItemData({
      nodes: [],
      edges: []
    });
  };

  /**
   * 检测前后环检测数据是否发生变化
   * @returns
   */
  const loopDetectionDataIsChange = () => {
    return !_.isEqual(loopDetectionData, cacheLastloopDetectionData.current);
  };

  /**
   * 通过环数据源获取圆环上所有的节点与边的实例数据, 并且将节点与边置为选中状态
   */
  const handleItemData = () => {
    // 此处处理环的索引，目的是为了每次点击环检测时，能够循环将画布中所有的环显示出来
    if (loopDetectionDataIsChange()) currentCycleIndex.current = 0;
    const cycleObj = loopDetectionData![currentCycleIndex.current];
    if (currentCycleIndex.current >= loopDetectionData!.length - 1) {
      currentCycleIndex.current = 0;
    } else {
      currentCycleIndex.current++;
    }

    const nodes: INode[] = graph.getNodes();
    const edges: IEdge[] = graph.getEdges();
    const targetEdges: IEdge[] = [];
    const targetNodes: INode[] = [];
    for (const nodeId in cycleObj) {
      if (cycleObj[nodeId]) {
        edges.forEach((edge: IEdge) => {
          const edgeDataModel = edge.getModel();
          if (
            edgeDataModel.visible &&
            edgeDataModel.source === nodeId &&
            edgeDataModel.target === cycleObj[nodeId].id
          ) {
            const existEdge = targetEdges.find(targetEdge => {
              const targetEdgeDataModel = targetEdge.getModel();
              if (
                targetEdgeDataModel.source === edgeDataModel.source &&
                targetEdgeDataModel.target === edgeDataModel.target
              ) {
                return true;
              }
              return false;
            });
            if (!existEdge) {
              targetEdges.push(edge);
            }
          }
        });
        nodes.forEach((node: INode) => {
          const nodeDataModel = node.getModel();
          if (nodeDataModel.visible && nodeDataModel.id === nodeId) {
            targetNodes.push(node);
          }
        });
      }
    }
    // 路径的终点就是起点
    if (targetNodes.length > 0) {
      targetNodes.push(targetNodes[0]);
    }
    // 聚焦环， 并将环的起点聚焦到画布中心
    graph.focusItems([...targetEdges, ...targetNodes], false);
    graph.focusItem(targetNodes[0]);
    onChangeData({ type: 'selected', data: { nodes: targetNodes, edges: targetEdges } });
    setItemData({
      nodes: targetNodes,
      edges: targetEdges
    });
    isMounted.current = true;
  };

  /**
   * 鼠标移入路径上的节点事件
   * @param node 节点的实例
   */
  const onMouseEnterPathNode = (node: INode) => {
    const isSelected = node.hasState('selected');
    // 更改状态
    if (isSelected) {
      // 说明已选中，需要有已选中的悬停效果
      graph.clearItemStates(node);
      graph.setItemState(node, '_path', true);
    } else {
      // 普通的悬停效果
      graph.clearItemStates(node);
      graph.setItemState(node, '_hover', true);
    }
  };

  /**
   * 鼠标移出路径上的节点事件
   * @param node 节点的实例
   */
  const onMouseLeavePathNode = (node: INode) => {
    if (node.hasState('_path')) {
      graph.clearItemStates(node);
      graph.setItemState(node, 'selected', true);
    }
    if (node.hasState('_hover')) {
      graph.clearItemStates(node);
    }
  };

  /**
   * 节点的点击事件
   * @param node
   */
  const onClickNode = (node: INode) => {
    // 点击路径上的节点，将节点聚焦到画布中心
    graph.focusItem(node);
  };

  const prefixCls = 'LoopDetection';

  return (
    <div className={`${prefixCls} kw-h-100 kw-flex-column`}>
      <LeftDrawerTitle
        visible
        title={intl.get('exploreGraph.algorithm.loopDetection')}
        onGoBack={onGoBack}
        onCloseLeftDrawer={onCloseLeftDrawer}
      />
      <div className="kw-pt-6 kw-flex-column" style={{ flex: 1, height: 0 }}>
        <div className="kw-space-between kw-pb-3">
          <span>{intl.get('exploreGraph.algorithm.loopDetectionBoardTitle')}</span>
          <span onClick={detectAllCycles} className="kw-pointer kw-c-link">
            {intl.get('exploreGraph.algorithm.loopDetection')}
          </span>
        </div>
        <div style={{ flex: 1, height: 0, overflow: 'auto' }}>
          {itemData.nodes.length > 0
            ? itemData.nodes.map((node, index) => {
                if (node._cfg) {
                  const prefixClsIcon = `${prefixCls}-path-icon`;
                  const nodeData = node?.getModel?.() as any;
                  return (
                    <div key={`${nodeData?.id}-${index}`} className="kw-mt-3">
                      <div
                        className="kw-align-center kw-pointer kw-mb-3"
                        onMouseEnter={() => onMouseEnterPathNode(node)}
                        onMouseLeave={() => onMouseLeavePathNode(node)}
                        onClick={() => onClickNode(node)}
                      >
                        {index === 0 || index === itemData.nodes.length - 1 ? (
                          <div style={{ width: 24 }} className="kw-center kw-mr-2">
                            <span
                              className={classNames(`${prefixClsIcon}`, {
                                [`${prefixClsIcon}-start`]: index === 0,
                                [`${prefixClsIcon}-end`]: itemData.nodes.length - 1 === index
                              })}
                            />
                          </div>
                        ) : (
                          <div
                            className={`${prefixCls}-node kw-center kw-mr-2`}
                            style={{ backgroundColor: nodeData?._sourceData?.fillColor as string, width: 24 }}
                          >
                            {nodeData?._sourceData?.icon && nodeData?._sourceData?.icon !== 'empty' && (
                              <IconFont type={nodeData?._sourceData?.icon as string} />
                            )}
                          </div>
                        )}
                        <div
                          className="kw-flex-item-full-width kw-ellipsis"
                          title={nodeData?._sourceData?.default_property?.value}
                        >
                          {nodeData?._sourceData?.default_property?.value}
                        </div>
                      </div>
                      {itemData.nodes.length - 1 !== index && (
                        <div style={{ width: 24 }} className="kw-center">
                          <MoreOutlined style={{ fontSize: 14 }} />
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })
            : isMounted.current && (
                <NoDataBox type="NO_CONTENT" desc={intl.get('exploreGraph.algorithm.loopDetectionToastTip')} />
              )}
        </div>
      </div>
    </div>
  );
};

export default LoopDetection;
