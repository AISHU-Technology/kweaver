import _ from 'lodash';

import HELPER from '@/utils/helper';

// 布局方向
const TB = 'TB'; // 从上到下, 根节点在上，往下布局
const BT = 'BT'; // 从下到上, 根节点在下，往上布局
const LR = 'LR'; // 从左往右, 根节点在左，往右布局
const RL = 'RL'; // 从右往左, 根节点在右，往左布局

const LIST_DIR = [TB, BT, LR, RL];

// 这里使用了国际化
const LABEL_DIR = {
  [TB]: 'enums.topToBottom',
  [BT]: 'enums.bottomToTop',
  [LR]: 'enums.leftToRight',
  [RL]: 'enums.rightToLeft'
};

const KEY_VALUE_LIST_DIR = HELPER.constructListFromKeysAndLabel(LIST_DIR, LABEL_DIR);

const getListDir = () => _.cloneDeep(LIST_DIR);
const getLabelDir = () => _.cloneDeep(LABEL_DIR);
const getKeyValueListDir = () => _.cloneDeep(KEY_VALUE_LIST_DIR);

// 对齐方式
const MM = 'MM'; // 中间对齐
const UL = 'UL'; // 对齐到左上角
const UR = 'UR'; // 对齐到右上角
const DL = 'DL'; // 对齐到左下角
const DR = 'DR'; // 对齐到右下角

const LIST_ALIGN = [MM, UL, UR, DL, DR];

// 这里使用了国际化
const LABEL_ALIGN = {
  [MM]: 'enums.alignMiddle',
  [UL]: 'enums.alignUpLeft',
  [UR]: 'enums.alignUpRight',
  [DL]: 'enums.alignDownLeft',
  [DR]: 'enums.alignDownRight'
};

const KEY_VALUE_LIST_ALIGN = HELPER.constructListFromKeysAndLabel(LIST_ALIGN, LABEL_ALIGN);

const getListAlign = () => _.cloneDeep(LIST_ALIGN);
const getLabelAlign = () => _.cloneDeep(LABEL_ALIGN);
const getKeyValueListAlign = () => _.cloneDeep(KEY_VALUE_LIST_ALIGN);

// 层次布局默认值
const DEFAULT_CONFIG = { direction: LR, align: MM, nodesep: 20, ranksep: 50 };

const GRAPH_LAYOUT_DAGRE_DIR = {
  TB,
  BT,
  LR,
  RL,
  getListDir,
  getLabelDir,
  getKeyValueListDir,

  MM,
  UL,
  UR,
  DL,
  DR,
  getListAlign,
  getLabelAlign,
  getKeyValueListAlign,

  DEFAULT_CONFIG
};

export default GRAPH_LAYOUT_DAGRE_DIR;
