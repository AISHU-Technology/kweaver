const DATE = 'date';
const DATE_TIME = 'datetime';
const BOOLEAN = 'boolean';
const STRING = 'string';
const FLOAT = 'float';
const DOUBLE = 'double';
const DECIMAL = 'decimal';
const INTEGER = 'integer';
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
