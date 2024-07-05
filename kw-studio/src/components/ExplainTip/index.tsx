import React from 'react';
import BaseTip, { BaseTipProps } from './BaseTip';
import {
  KnowledgeSource,
  KnowledgeTotalSource,
  QualitySource,
  DomainIQTip,
  MissingTip,
  RepeatRateTip
} from './DomainIQExplain';

const ExplainTip: React.FC<BaseTipProps> = ({ type = 'DEFAULT', ...props }) => {
  const ComponentMap: { [key: string]: React.ComponentType<any> } = {
    KNW_SOURCE: KnowledgeSource,
    KNW_TOTAL_SOURCE: KnowledgeTotalSource,
    QUALITY_SOURCE: QualitySource,
    DOMAIN_IQ: DomainIQTip,
    MISSING: MissingTip,
    REPEAT_RATE: RepeatRateTip,
    DEFAULT: BaseTip
  };

  const ComponentToRender = ComponentMap[type] || BaseTip;

  return <ComponentToRender {...props} />;
};

export default ExplainTip;
