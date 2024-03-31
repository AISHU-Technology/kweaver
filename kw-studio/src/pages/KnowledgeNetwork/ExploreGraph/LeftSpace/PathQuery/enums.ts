import { TypeFilter } from './type';

const POSITIVE = 'positive'; // 正向
const REVERSE = 'reverse'; // 反向
const BIDIRECT = 'bidirect'; // 双向

const ALL = 0;
const SHORTEST = 1;
const ACYCLIC = 2;

const PATH_DEPTH = 'path_depth'; // 路径深度
const WEIGHT_PROPERTY = 'weight_property'; // 权重属性

// 路径类型
export const TYPE_OPTION: any = {
  graph: [
    { value: ALL, label: 'exploreGraph.allTwo' },
    { value: ACYCLIC, label: 'exploreGraph.noLoop' },
    { value: SHORTEST, label: 'exploreGraph.shortPathTwo' }
  ],
  canvas: [
    { value: ACYCLIC, label: 'exploreGraph.noLoop' },
    { value: SHORTEST, label: 'exploreGraph.shortPathTwo' }
  ]
};
// 权重选择
export const WEIGHT_OPTION = [
  { label: 'exploreGraph.pathDeps', value: PATH_DEPTH },
  { label: 'exploreGraph.weightAttr', value: WEIGHT_PROPERTY }
];
// 方向
export const DIRECTION = [
  { label: 'exploreGraph.positive', value: POSITIVE }, // 正向
  { label: 'exploreGraph.reverse', value: REVERSE }, // 反向
  { label: 'exploreGraph.bidirectional', value: BIDIRECT } // 全部
];

/** 默认过滤参数 */
export const DEFAULT_FILTER: TypeFilter = {
  path_type: ALL,
  direction: POSITIVE,
  searchScope: 'graph',
  steps: 5,
  path_decision: PATH_DEPTH,
  edges: '',
  property: '',
  default_value: undefined
};

export { SHORTEST, WEIGHT_PROPERTY, PATH_DEPTH };
