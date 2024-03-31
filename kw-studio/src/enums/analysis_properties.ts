const ID = '#id'; // id
const ENTITY_CLASS = '#entity_class'; // 实体类名
const EDGE_CLASS = '#edge_class'; // 关系类名
const ALIAS = '#alias'; // 显示名
// 国际化
const textMap: Record<string, string> = {
  [ID]: 'exploreGraph.id',
  [ENTITY_CLASS]: 'exploreGraph.entityClassAtr',
  [EDGE_CLASS]: 'exploreGraph.edgeClassAtr',
  [ALIAS]: 'exploreGraph.showName'
};

export const ANALYSIS_PROPERTIES = {
  entityAttr: [ID, ENTITY_CLASS, ALIAS],
  edgeAttr: [ID, EDGE_CLASS, ALIAS],
  textMap,
  defaultAtr: ['_ds_id_', '_name_', '_timestamp_'] // 数据库自动添加的属性key
};
