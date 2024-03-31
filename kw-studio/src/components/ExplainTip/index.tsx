/**
 * tip解释
 */
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

type ExplainTipInterface = React.FC<BaseTipProps> & {
  KNW_SOURCE: Function;
  KNW_TOTAL_SOURCE: Function;
  QUALITY_SOURCE: Function;
  DOMAIN_IQ: Function;
  MISSING: Function;
  REPEAT_RATE: Function;
};

const ExplainTip = BaseTip as ExplainTipInterface;
ExplainTip.KNW_SOURCE = KnowledgeSource;
ExplainTip.KNW_TOTAL_SOURCE = KnowledgeTotalSource;
ExplainTip.QUALITY_SOURCE = QualitySource;
ExplainTip.DOMAIN_IQ = DomainIQTip;
ExplainTip.MISSING = MissingTip;
ExplainTip.REPEAT_RATE = RepeatRateTip;

export default ExplainTip;
