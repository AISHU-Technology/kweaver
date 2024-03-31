import React, { useState } from 'react';
import _ from 'lodash';
import { Algorithm } from '@antv/g6';

import { LeftDrawerTitle } from '../../components';
import PageRankConfig from './PageRankConfig';
import PageRankResult from './PageRankResult';

import './style.less';

const LEVEL_SIZE = [
  { range: [0, 0], level: 1, size: 16 },
  { range: [0, 20], level: 2, size: 24 },
  { range: [40, 60], level: 3, size: 36 },
  { range: [60, 80], level: 4, size: 48 },
  { range: [80, 101], level: 5, size: 64 }
];

const addNodeExtendedProperties = (nodes: object[], base: number) => {
  return _.map(nodes, (item: any) => {
    if (item?.pageRank === 0) {
      item.size = LEVEL_SIZE[0].size;
    } else {
      const size = (item?.pageRank / base) * 100 || 0;
      for (let i = 0; i < LEVEL_SIZE.length; i++) {
        const LEVEL = LEVEL_SIZE[i];
        if (size >= LEVEL.range[0] && size < LEVEL.range[1]) {
          item.size = LEVEL.size;
          break;
        }
      }
    }
    return item;
  });
};

const PageRank = (props: any) => {
  const { selectedItem } = props;
  const { onGoBack, onChangeData, onCanUseScaling, onCloseLeftDrawer } = props;

  const [result, setResult] = useState<any>(null); // 分析结果
  const [params, setParams] = useState<any>({ epsilon: 0.000001, linkProb: 0.85 });

  const [isFirstRender, setIsFirstRender] = useState(true);
  const onChangeRenderIndex = (value: boolean) => setIsFirstRender(value);

  /** 开始分析 */
  const onAnalysis = async (values: any) => {
    onChangeData({ type: 'isLoading', data: true });
    setParams(values);
    const { epsilon, linkProb } = values;
    const data = {
      nodes: _.map(selectedItem.graph.current.getNodes(), item => item.getModel()),
      edges: _.map(selectedItem.graph.current.getEdges(), item => item.getModel())
    };

    const result = await (Algorithm as any).pageRank(data, epsilon, linkProb);
    setResult(result);
    onChangeData({ type: 'isLoading', data: false });

    const max = Math.max(..._.values(result));
    let nodes = _.map(selectedItem.graphData.nodes, item => {
      return { ...item, pageRank: result?.[item?.id] || 0 };
    });
    nodes = addNodeExtendedProperties(nodes, max);
    selectedItem.graph.current.graphStack.pushStack('update', {
      before: { nodes: selectedItem.graphData.nodes, edges: [] },
      after: { nodes, edges: [] }
    });
    onChangeData({ type: 'graphData', data: { nodes, edges: selectedItem.graphData.edges } });
    onCanUseScaling(true);
  };

  /** 控制展示配置 or 结果 */
  const visibleAlgorithmConfig = _.isEmpty(result);
  const onBackToAlgorithmConfig = () => {
    setResult(null);
    onCanUseScaling(false);
    onChangeRenderIndex(true);
  };

  return (
    <div className="pageRankRoot">
      <LeftDrawerTitle
        visible={selectedItem?.isLoading || visibleAlgorithmConfig}
        title="PageRank"
        onGoBack={onGoBack}
        onCloseLeftDrawer={onCloseLeftDrawer}
      />

      {(selectedItem?.isLoading || visibleAlgorithmConfig) && (
        <PageRankConfig params={params} isLoading={selectedItem?.isLoading} onAnalysis={onAnalysis} />
      )}
      {!visibleAlgorithmConfig && !selectedItem?.isLoading && (
        <PageRankResult
          title="PageRank"
          source={result}
          selectedItem={selectedItem}
          isFirstRender={isFirstRender}
          onChangeData={onChangeData}
          onGoBack={onBackToAlgorithmConfig}
          onCloseLeftDrawer={onCloseLeftDrawer}
          onChangeRenderIndex={onChangeRenderIndex}
        />
      )}
    </div>
  );
};

export default PageRank;
