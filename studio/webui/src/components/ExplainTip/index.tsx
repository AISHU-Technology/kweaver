/**
 * tip解释
 */
import React from 'react';
import BaseTip, { BaseTipProps } from './BaseTip';
import KnowledgeSource from './KnowledgeSource';
import KnowledgeTotalSource from './KnowledgeTotalSource';
import QualitySource from './QualitySource';
import DomainIQTip from './DomainIQTip';

type ExplainTipInterface = React.FC<BaseTipProps> & {
  KNW_SOURCE: Function;
  KNW_TOTAL_SOURCE: Function;
  QUALITY_SOURCE: Function;
  DOMAIN_IQ: Function;
};
const ExplainTip = BaseTip as ExplainTipInterface;
ExplainTip.KNW_SOURCE = KnowledgeSource;
ExplainTip.KNW_TOTAL_SOURCE = KnowledgeTotalSource;
ExplainTip.QUALITY_SOURCE = QualitySource;
ExplainTip.DOMAIN_IQ = DomainIQTip;

export default ExplainTip;
