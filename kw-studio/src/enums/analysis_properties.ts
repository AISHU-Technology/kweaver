const ID = '#id';
const ENTITY_CLASS = '#entity_class';
const EDGE_CLASS = '#edge_class';
const ALIAS = '#alias';
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
  defaultAtr: ['_ds_id_', '_name_', '_timestamp_']
};
