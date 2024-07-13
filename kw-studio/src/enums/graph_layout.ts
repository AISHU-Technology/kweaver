import _ from 'lodash';

import HELPER from '@/utils/helper';

const FREE = 'free';
const TREE = 'tree';
const DAGRE = 'dagre';
const FORCE = 'force';

const LIST = [FREE, TREE, DAGRE, FORCE];

const LABEL = {
  [FREE]: 'exploreGraph.layout.freeLayout',
  [TREE]: 'exploreGraph.layout.compactBoxLayout',
  [DAGRE]: 'exploreGraph.layout.dagreLayout',
  [FORCE]: 'exploreGraph.layout.forceLayout'
};

const KEY_VALUE_LIST = HELPER.constructListFromKeysAndLabel(LIST, LABEL);

const getList = () => _.cloneDeep(LIST);
const getLabel = () => _.cloneDeep(LABEL);
const getKeyValueList = () => _.cloneDeep(KEY_VALUE_LIST);

const GRAPH_LAYOUT = {
  FREE,
  TREE,
  DAGRE,
  FORCE,
  getList,
  getLabel,
  getKeyValueList
};

export default GRAPH_LAYOUT;
