/**
 * 顶部步骤条
 */
import React, { memo, useMemo } from 'react';
import intl from 'react-intl-universal';
import './style.less';
import AdSteps from '@/components/AdSteps';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

export interface TopStepsProps {
  current: number;
  graphName: string;
  onExit: () => void;
}

const TopSteps = (props: any) => {
  const { graphStepNum, current, onStepChange, graphName, onExit, ontoData } = props;

  // 所有步骤条标题
  const stepItems = useMemo(() => {
    let entity = [];
    if (ontoData.length > 0) {
      entity = ontoData[0].entity;
    }
    return [
      { title: intl.get('workflow.basic.basic'), disabled: !(graphStepNum > 0) },
      { title: intl.get('workflow.datasource.datasource'), disabled: !(graphStepNum > 0) },
      { title: intl.get('workflow.onto.onto'), disabled: !(graphStepNum > 0) },
      { title: intl.get('workflow.knowledge.knowledge'), disabled: !(graphStepNum >= 3) || entity.length === 0 }
    ];
  }, [graphStepNum, ontoData]);

  // const stepChange = (step: number) => {
  //   // setCurrent?.(step);
  //   // sessionStore.set('graphFlowStep', step);
  // };

  return (
    <AdExitBar
      style={{ height: 48, border: 0 }}
      onExit={onExit}
      title={graphName}
      extraContent={<AdSteps type="navigation" items={stepItems} current={current} onChange={onStepChange} />}
    />
  );
};

export default memo(TopSteps);
