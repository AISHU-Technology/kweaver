import _ from 'lodash';

import HELPER from '@/utils/helper';

const LR = 'LR'; // 从左往右, 根节点在左，往右布局
const RL = 'RL'; // 从右往左, 根节点在右，往左布局
const TB = 'TB'; // 从上到下, 根节点在上，往下布局
const BT = 'BT'; // 从下到上, 根节点在下，往上布局
const H = 'H'; // 水平对称, 根节点在中间，水平对称布局
const V = 'V'; // 垂直对称, 根节点在中间，垂直对称布局

const LIST = [LR, RL, TB, BT, H, V];

// 这里使用了国际化
const LABEL = {
  [LR]: 'enums.leftToRight',
  [RL]: 'enums.rightToLeft',
  [TB]: 'enums.topToBottom',
  [BT]: 'enums.bottomToTop',
  [H]: 'enums.horizontal',
  [V]: 'enums.vertical'
};

const KEY_VALUE_LIST = HELPER.constructListFromKeysAndLabel(LIST, LABEL);

const getList = () => _.cloneDeep(LIST);
const getLabel = () => _.cloneDeep(LABEL);
const getKeyValueList = () => _.cloneDeep(KEY_VALUE_LIST);

// 紧凑树布局默认值
const DEFAULT_CONFIG = { direction: LR, hGap: 80, vGap: 80, limit: 15, isGroup: true };

const GRAPH_LAYOUT_TREE_DIR = {
  LR,
  RL,
  TB,
  BT,
  H,
  V,
  getList,
  getLabel,
  getKeyValueList,

  DEFAULT_CONFIG
};

export default GRAPH_LAYOUT_TREE_DIR;
