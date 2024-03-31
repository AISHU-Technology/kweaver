// 'boolean', 'date', 'datetime', 'decimal', 'double', 'float', 'integer', 'string'

const DATE = 'date'; // 日期
const DATE_TIME = 'datetime'; // 日期

const BOOLEAN = 'boolean'; // boolean 值

const STRING = 'string'; // 字符串

// 虽然double型比float型精度高，但由于占内存更大，运算速度慢，
// 且即使是double依然会存在精度损失的问题，且不会报告任何的错误，也不会有任何的异常产生。
// 所以如果涉及到小数计算的话，我们会用到下边的decimal型

const FLOAT = 'float'; // 小数 - 单精度小数部分能精确到小数点后面6位
const DOUBLE = 'double'; // 小数 - 双精度小数部分能精确到小数点后的15位
const DECIMAL = 'decimal'; // 小数 - 数字型
const INTEGER = 'integer'; // 整数

const LIST = [DATE, DATE_TIME, BOOLEAN, STRING, FLOAT, DOUBLE, DECIMAL, INTEGER];

const SQL_TYPE_TO_JS_TYPE = {
  [DATE]: 'date',
  [DATE_TIME]: 'date',
  [BOOLEAN]: 'boolean',
  [STRING]: 'string',
  [FLOAT]: 'number',
  [DOUBLE]: 'number',
  [DECIMAL]: 'number',
  [INTEGER]: 'number'
};

const PROPERTIES_TYPE = {
  DATE,
  DATE_TIME,
  BOOLEAN,
  STRING,
  FLOAT,
  DOUBLE,
  DECIMAL,
  INTEGER,
  LIST,
  SQL_TYPE_TO_JS_TYPE
};

export default PROPERTIES_TYPE;
