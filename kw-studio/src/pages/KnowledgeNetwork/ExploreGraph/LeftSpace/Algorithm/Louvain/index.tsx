import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { Algorithm } from '@antv/g6';
import type { SelectProps } from 'antd';

import { LeftDrawerTitle } from '../../components';
import { LouvainType, LouvainParamsType } from '../type';
import LouvainConfig from './LouvainConfig';
import LouvainResult from './LouvainResult';

import './style.less';

const NUMBER_TYPE = ['float', 'integer', 'double'];
/**
 * louvain 图计算
 * @param {object} selectedItem - 图谱实例
 * @param {AlgorithmType} algorithmData - 图算法信息
 * @param {function} onGoBack - 返回图计算列表
 * @param {function} onChangeData - 图谱实例数据变更
 * @param {function} onCanUseScaling - 侧边栏是否可以拖动
 * @param {function} onCloseLeftDrawer - 关闭左侧侧边栏
 */
const Louvain = (props: LouvainType) => {
  const { selectedItem, algorithmData } = props;
  const { onGoBack, onChangeData, onCanUseScaling, onCloseLeftDrawer, onJudgeOnlyOneClassEdge } = props;
  const { label } = algorithmData;

  const [result, setResult] = useState(null); // 分析结果
  const [optionsEdges, setOptionsEdges] = useState<SelectProps['options'] | undefined>(undefined); // 关系类类型选项
  const [optionsWeight, setOptionsWeight] = useState<SelectProps['options'] | undefined>(undefined); // 权重选项
  const [params, setParams] = useState<LouvainParamsType>({
    // 图计算参数
    directed: true,
    weightPropertyName: '',
    threshold: 0.0001
  });

  const [isFirstRender, setIsFirstRender] = useState(true);
  const onChangeRenderIndex = (value: boolean) => setIsFirstRender(value);

  useEffect(() => {
    const _edges: SelectProps['options'] = [];
    const _properties: SelectProps['options'] = [];
    const sourceData = selectedItem.graph.current.getEdges()[0]?.getModel()?._sourceData;
    _edges.push({ value: sourceData?.class, label: sourceData?.alias });
    _.forEach(sourceData?.showLabels, d => {
      if (_.includes(NUMBER_TYPE, d.type)) _properties.push({ value: `weight_${d.key}`, label: d?.alias });
    });

    setOptionsEdges(_edges);
    setOptionsWeight(_properties);
  }, []);

  /** 图计算参数变更 */
  const onChangeParams = (type: string) => (value: any) => {
    const newParams = { ...params, [type]: value };
    if (type === 'directed' && value === 'directed') newParams.directed = true;
    if (type === 'directed' && value === 'undirected') newParams.directed = false;

    if (type) setParams(newParams);
  };

  /** 开始分析 */
  const onAnalysis = async () => {
    const isOnlyOneClassEdge = onJudgeOnlyOneClassEdge();
    if (isOnlyOneClassEdge) return;
    onChangeData({ type: 'isLoading', data: true });
    const data = {
      nodes: _.map(selectedItem.graph.current.getNodes(), item => item.getModel()),
      edges: _.map(selectedItem.graph.current.getEdges(), item => {
        const model = item.getModel();
        const weightProperty: { [key: string]: number } = {};
        _.forEach(model?._sourceData?.showLabels, item => {
          if (_.includes(NUMBER_TYPE, item.type)) weightProperty[`weight_${item.key}`] = item.value;
        });
        return { ...model, ...weightProperty };
      })
    };
    const { directed, weightPropertyName = 'weight', threshold } = params;

    const result = await (Algorithm as any).louvain(data, directed, weightPropertyName || 'weight', threshold);
    onChangeData({ type: 'isLoading', data: false });
    setResult(result);
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
    <div className={classnames('louvainRoot')}>
      <LeftDrawerTitle
        visible={selectedItem?.isLoading || visibleAlgorithmConfig}
        title={label}
        onGoBack={onGoBack}
        onCloseLeftDrawer={onCloseLeftDrawer}
      />
      {(selectedItem?.isLoading || visibleAlgorithmConfig) && (
        <LouvainConfig
          params={params}
          isLoading={selectedItem?.isLoading}
          optionsEdges={optionsEdges}
          optionsWeight={optionsWeight}
          onAnalysis={onAnalysis}
          onChangeParams={onChangeParams}
        />
      )}

      {!visibleAlgorithmConfig && !selectedItem?.isLoading && (
        <LouvainResult
          title={label}
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

export default Louvain;
