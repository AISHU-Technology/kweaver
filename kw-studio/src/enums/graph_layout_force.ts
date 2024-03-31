import _ from 'lodash';

// 层次布局默认值
const DEFAULT_CONFIG = { linkDistance: 150, nodeStrength: 0 };
const getDefault = () => _.cloneDeep(DEFAULT_CONFIG);

const GRAPH_LAYOUT_FORCE = {
  getDefault
};

export default GRAPH_LAYOUT_FORCE;
