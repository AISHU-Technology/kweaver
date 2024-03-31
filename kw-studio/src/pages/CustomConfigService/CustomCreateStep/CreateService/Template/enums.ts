/**
 * 模板列表描述国际化
 */

import intl from 'react-intl-universal';

export const INTENT_GRAPH_ANALYSIS_COGNITION_GRAPH = {
  description: intl.get('customService.IntentGraphAnalysisCognitionGraph.description'),
  query: intl.get('customService.IntentGraphAnalysisCognitionGraph.query')
};

export const KBQA_BETA = {
  description: intl.get('customService.KbqaBeta.description'),
  query: intl.get('customService.KbqaBeta.query'),
  kg_list: intl.get('customService.KbqaBeta.kg_list'),
  answers: intl.get('customService.KbqaBeta.answers'),
};

/**
 * 模板翻译
 */
export const selectToTemplate: Record<any, any> = {
  'Intent-GraphAnalysisCognitionGraph': INTENT_GRAPH_ANALYSIS_COGNITION_GRAPH,
  'KBQA-beta': KBQA_BETA
};
