/**
 * 执行器列表描述国际化
 */

import intl from 'react-intl-universal';

export const GRAPH_FULL_TEXT_SEARCH_EXECUTOR = {
  description: intl.get('customService.graphFullTextSearchExecutor.description'),
  query: intl.get('customService.graphFullTextSearchExecutor.query'),
  cat: intl.get('customService.graphFullTextSearchExecutor.cat'),
  page: intl.get('customService.graphFullTextSearchExecutor.page'),
  size: intl.get('customService.graphFullTextSearchExecutor.size'),
  kg_list: intl.get('customService.graphFullTextSearchExecutor.kg_list'),
  count: intl.get('customService.graphFullTextSearchExecutor.count'),
  entities: intl.get('customService.graphFullTextSearchExecutor.entities')
};

export const GRAPH_QA_EXECUTOR = {
  description: intl.get('customService.graphQAExecutor.description'),
  query: intl.get('customService.graphQAExecutor.query'),
  kg_list: intl.get('customService.graphQAExecutor.kg_list'),
  answers: intl.get('customService.graphQAExecutor.answers'),
  openai_auth_error: intl.get('customService.graphQAExecutor.openai_auth_error'),
  graph_schema_and_synonyms: intl.get('customService.graphQAExecutor.graph_schema_and_synonyms')
};

export const ENTITY_LINKING_EXECUTOR = {
  description: intl.get('customService.entityLinkingExecutor.description'),
  query: intl.get('customService.entityLinkingExecutor.query'),
  kg_list: intl.get('customService.entityLinkingExecutor.kg_list'),
  vertices: intl.get('customService.entityLinkingExecutor.vertices'),
  graph_qa_answer_list: intl.get('customService.entityLinkingExecutor.graph_qa_answer_list'),
  outVertices: intl.get('customService.entityLinkingExecutor.outVertices')
};

export const KNOWLEDGE_CARD_EXECUTOR = {
  description: intl.get('customService.knowledgeCardExecutor.description'),
  vertices: intl.get('customService.knowledgeCardExecutor.vertices'),
  knowledge_card: intl.get('customService.knowledgeCardExecutor.knowledge_card')
};

export const RELATED_KNOWLEDGE_EXECUTOR = {
  description: intl.get('customService.relatedKnowledgeExecutor.description'),
  vertices: intl.get('customService.relatedKnowledgeExecutor.vertices'),
  related_knowledge: intl.get('customService.relatedKnowledgeExecutor.related_knowledge')
};

export const INTENT_RECOGNITION_EXECUTOR = {
  description: intl.get('customService.intentRecognitionExecutor.description'),
  query: intl.get('customService.intentRecognitionExecutor.query'),
  answers: intl.get('customService.intentRecognitionExecutor.answers')
};

export const GRAPH_SYN_SEARCH_EXECUTOR = {
  description: intl.get('customService.graphSynSearchExecutor.description'),
  query: intl.get('customService.graphSynSearchExecutor.query'),
  limit: intl.get('customService.graphSynSearchExecutor.limit'),
  count: intl.get('customService.graphSynSearchExecutor.count'),
  entities: intl.get('customService.graphSynSearchExecutor.entities'),
  answer: intl.get('customService.graphSynSearchExecutor.answer'),
  subgraphs: intl.get('customService.graphSynSearchExecutor.subgraphs'),
  stopwords: intl.get('customService.graphSynSearchExecutor.stopwords'),
  stop_entities: intl.get('customService.graphSynSearchExecutor.stop_entities'),
  filter: intl.get('customService.graphSynSearchExecutor.filter'),
  query_cuts: intl.get('customService.graphSynSearchExecutor.query_cuts')
};

export const INTENTION_GAS_LINKING_EXECUTOR = {
  description: intl.get('customService.intentionGASLinkingExecutor.description'),
  query: intl.get('customService.intentionGASLinkingExecutor.query'),
  subgraph: intl.get('customService.intentionGASLinkingExecutor.subgraph')
};

export const LLM_ANS_ORG_EXECUTOR = {
  description: intl.get('customService.LLMAnsOrgExecutor.description'),
  query: intl.get('customService.LLMAnsOrgExecutor.query'),
  subgraph: intl.get('customService.LLMAnsOrgExecutor.subgraph'),
  graph_schema_and_synonyms: intl.get('customService.LLMAnsOrgExecutor.graph_schema_and_synonyms'),
  graph_qa_ans: intl.get('customService.LLMAnsOrgExecutor.graph_qa_ans'),
  answer: intl.get('customService.LLMAnsOrgExecutor.answer'),
  openai_auth_error: intl.get('customService.LLMAnsOrgExecutor.openai_auth_error')
};

export const RECOMMEND_CODE_EXECUTOR = {
  description: intl.get('customService.RecommendCodeExecutor.description'),
  query: intl.get('customService.RecommendCodeExecutor.query')
};

export const INTENTION_UNDERSTANDING_EXECUTOR = {
  description: intl.get('customService.IntentionUnderstandingExecutor.description'),
  query: intl.get('customService.IntentionUnderstandingExecutor.query'),
  intent_slots: intl.get('customService.IntentionUnderstandingExecutor.intent_slots')
};

export const GRAPH_ANALYSIS_SERVICE_EXECUTOR = {
  description: intl.get('customService.GraphAnalysisServiceExecutor.description'),
  query: intl.get('customService.GraphAnalysisServiceExecutor.query'),
  intent_slots: intl.get('customService.GraphAnalysisServiceExecutor.intent_slots'),
  subgraph: intl.get('customService.GraphAnalysisServiceExecutor.subgraph')
};

export const ACKNOWLEDGE_LINK_EXECUTOR = {
  description: intl.get('customService.AcKnowledgeLinkExecutor.description'),
  query: intl.get('customService.AcKnowledgeLinkExecutor.query'),
  entity_list: intl.get('customService.AcKnowledgeLinkExecutor.entity_list'),
  knowledge: intl.get('customService.AcKnowledgeLinkExecutor.knowledge')
};

export const RULE_BASED_KBQA_EXECUTOR = {
  description: intl.get('customService.RuleBasedKBQAExecutor.description'),
  query: intl.get('customService.RuleBasedKBQAExecutor.query'),
  knowledge: intl.get('customService.RuleBasedKBQAExecutor.knowledge'),
  graph2answer: intl.get('customService.RuleBasedKBQAExecutor.graph2answer')
};

export const OS_ENTITY_EXTRACT_LINK_EXECUTOR = {
  description: intl.get('customService.OSEntityExtractLinkExecutor.description'),
  query: intl.get('customService.OSEntityExtractLinkExecutor.query'),
  kg_list: intl.get('customService.OSEntityExtractLinkExecutor.kg_list'),
  entities: intl.get('customService.OSEntityExtractLinkExecutor.entities')
};

export const PATH_SIMQA_EXECUTOR = {
  description: intl.get('customService.PathSimQAExecutor.description'),
  query: intl.get('customService.PathSimQAExecutor.query'),
  kg_list: intl.get('customService.PathSimQAExecutor.kg_list'),
  rule_answers: intl.get('customService.PathSimQAExecutor.rule_answers'),
  entities: intl.get('customService.PathSimQAExecutor.entities'),
  answers: intl.get('customService.PathSimQAExecutor.answers'),
  graph_schema_and_synonyms: intl.get('customService.PathSimQAExecutor.graph_schema_and_synonyms'),
  embed_model_error: intl.get('customService.PathSimQAExecutor.embed_model_error'),
  answer_list: intl.get('customService.PathSimQAExecutor.answer_list'),
  // rule_answers: intl.get('customService.PathSimQAExecutor.answer_list'),
  openai_auth_error: intl.get('customService.PathSimQAExecutor.openai_auth_error'),
  openai_err_type: intl.get('customService.PathSimQAExecutor.openai_err_type'),
  rule_answers_out: intl.get('customService.PathSimQAExecutor.rule_answers_out'),
};

/**
 * 执行器/知识组件翻译
 */
export const selectToExecutor: Record<any, any> = {
  GraphFullTextSearchExecutor: GRAPH_FULL_TEXT_SEARCH_EXECUTOR,
  GraphQAExecutor: GRAPH_QA_EXECUTOR,
  EntityLinkingExecutor: ENTITY_LINKING_EXECUTOR,
  KnowledgeCardExecutor: KNOWLEDGE_CARD_EXECUTOR,
  RelatedKnowledgeExecutor: RELATED_KNOWLEDGE_EXECUTOR,
  IntentRecognitionExecutor: INTENT_RECOGNITION_EXECUTOR,
  GraphSynSearchExecutor: GRAPH_SYN_SEARCH_EXECUTOR,
  IntentionGASLinkingExecutor: INTENTION_GAS_LINKING_EXECUTOR,
  LLMAnsOrgExecutor: LLM_ANS_ORG_EXECUTOR,
  RecommendCodeExecutor: RECOMMEND_CODE_EXECUTOR,
  IntentionUnderstandingExecutor: INTENTION_UNDERSTANDING_EXECUTOR,
  GraphAnalysisExecutor: GRAPH_ANALYSIS_SERVICE_EXECUTOR,

  AcKnowledgeLinkExecutor: ACKNOWLEDGE_LINK_EXECUTOR,
  RuleBasedKBQAExecutor: RULE_BASED_KBQA_EXECUTOR,
  OSEntityExtractLinkExecutor: OS_ENTITY_EXTRACT_LINK_EXECUTOR,
  PathSimQAExecutor: PATH_SIMQA_EXECUTOR
};
