import _ from 'lodash';

import HELPER from '@/utils/helper';

const FREE = 'free'; // 自由布局
const TREE = 'tree'; // 层次布局
const DAGRE = 'dagre'; // 层次布局
const FORCE = 'force'; // 力导布局

const LIST = [FREE, TREE, DAGRE, FORCE];

// 这里使用了国际化
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
