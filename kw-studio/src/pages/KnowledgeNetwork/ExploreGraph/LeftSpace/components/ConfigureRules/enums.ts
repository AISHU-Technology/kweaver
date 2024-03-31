// 本体属性的类型 ['boolean', 'date', 'datetime', 'decimal', 'double', 'float', 'integer', 'string']

const EQUALS_TO = 'eq'; // 等于
const NOT_EQUALS_TO = 'neq'; // 不等于
const IS = 'eq'; // 是
const INCLUDES = 'contains'; // 包含
const EXCLUDES = 'not_contains'; // 不包含
const MATCHES_PREFIX = 'starts_with'; // 开头匹配
const MATCHES_POSTFIX = 'ends_with'; // 结尾匹配
const UNMATCHES_PREFIX = 'not_starts_with'; // 开头不匹配
const UNMATCHES_POSTFIX = 'not_ends_with'; // 结尾不匹配
const GREATER_THAN = 'gt'; // 大于
const EQUAL_OR_ABOVE = 'gte'; // 大于等于
const LESS_THAN = 'lt'; // 小于
const EQUAL_OR_BELOW = 'lte'; // 小于等于

const SATISFY_ALL = 'satisfy_all'; // 满足全部
const SATISFY_ANY = 'satisfy_any'; // 满足任意
const UNSATISFY_ALL = 'unsatisfy_all'; // 不满足全部
const UNSATISFY_ANY = 'unsatisfy_any'; // 不满足任意
const SATISFY = 'satisfy'; // 满足
const UNSATISFY = 'unsatisfy'; // 不满足

const AND = 'and'; // 且
const OR = 'or'; // 或

// 字符串类型的运算符
const _STRING = [
  { label: 'exploreGraph.equalTo', symbol: '=', value: EQUALS_TO }, // 等于
  { label: 'exploreGraph.noequal', symbol: '<>', value: NOT_EQUALS_TO }, // 不等于
  { label: 'exploreGraph.includes', value: INCLUDES }, // 包含
  { label: 'exploreGraph.matchesPrefix', value: MATCHES_PREFIX }, // 开头匹配
  { label: 'exploreGraph.matchesEnd', value: MATCHES_POSTFIX }, // 结尾匹配
  { label: 'exploreGraph.excludes', value: EXCLUDES }, // 不包含
  { label: 'exploreGraph.unMatchesPrefix', value: UNMATCHES_PREFIX }, // 开头不匹配
  { label: 'exploreGraph.unMatchesEnd', value: UNMATCHES_POSTFIX } // 结尾不匹配
];

// 数字类型的运算符
const _NUMBER = [
  { label: 'exploreGraph.equalTo', symbol: '=', value: EQUALS_TO }, // '等于'
  { label: 'exploreGraph.noequal', symbol: '<>', value: NOT_EQUALS_TO }, // '不等于'
  { label: 'exploreGraph.greater', symbol: '>', value: GREATER_THAN }, // '大于'
  { label: 'exploreGraph.eqOrAbove', symbol: '>=', value: EQUAL_OR_ABOVE }, // '大于等于'
  { label: 'exploreGraph.less', symbol: '<', value: LESS_THAN }, // '小于'
  { label: 'exploreGraph.eqOrBelow', symbol: '<=', value: EQUAL_OR_BELOW } // '小于等于'
];

// 时间类型的运算符
const _DATE = [
  { label: 'global.is', value: EQUALS_TO }, // '等于 是'
  { label: 'global.not', value: NOT_EQUALS_TO }, // '不等于 不是'
  { label: 'global.before', value: LESS_THAN }, // '小于 早于'
  { label: 'global.after', value: GREATER_THAN } // '大于 晚于'
];

// 默认的运算符 可定义其他的
export const defaultOperator = { SATISFY_ALL, EQUALS_TO, IS, AND };

export const NUMBERKEY = ['int', 'integer', 'double', 'float', 'decimal', 'int64'];

// 属性类型
export const PROTYPE: Record<any, any> = {
  string: _STRING,
  number: _NUMBER,
  date: _DATE,
  datetime: _DATE,
  boolean: [{ label: 'exploreGraph.is', value: IS }]
};

// 筛选组与组的关系
// export const GROUPCONDITIONS = [
//   { label: 'exploreGraph.satisfyAll', value: SATISFY_ALL }, // '满足全部'
//   { label: 'exploreGraph.satisfyAny', value: SATISFY_ANY }, // '满足任意'
//   { label: 'exploreGraph.unSatisfyAll', value: UNSATISFY_ALL }, // '不满足全部'
//   { label: 'exploreGraph.unSatisfyAny', value: UNSATISFY_ANY } // '不满足任意'
// ];

// 筛选组与组的关系
export const GROUPCONDITIONS = [
  { label: 'global.satisfy', value: SATISFY }, // '满足'
  { label: 'global.unSatisfy', value: UNSATISFY } // '不满足'
];

export const groupType: Record<any, any> = {
  // 满足+且= 满足全部  不满足+且=不满足任意
  [SATISFY_ALL]: { type: SATISFY, relation: AND },
  [SATISFY_ANY]: { type: SATISFY, relation: OR },
  [UNSATISFY_ALL]: { type: UNSATISFY, relation: OR },
  [UNSATISFY_ANY]: { type: UNSATISFY, relation: AND }
};

// 布尔类型
export const RELATION = [
  { label: 'exploreGraph.and', value: AND },
  { label: 'exploreGraph.or', value: OR }
];

// 搜索规则类型
export const FILTER_TYPE: { v: 'v_filters'; e: 'e_filters' } = { v: 'v_filters', e: 'e_filters' };

export const GROUP_RELATION = { SATISFY_ALL, SATISFY_ANY, UNSATISFY_ALL, UNSATISFY_ANY };
