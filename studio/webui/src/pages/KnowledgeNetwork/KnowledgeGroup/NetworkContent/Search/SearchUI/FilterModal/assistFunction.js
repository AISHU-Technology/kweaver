import intl from 'react-intl-universal';

/**
 * 显示选择范围
 * @param {String} type 范围类型
 */
const showRangeType = type => {
  switch (type) {
    case '<':
      return intl.get('search.lessthan');
    case '~':
      return intl.get('search.between');
    case '>':
      return intl.get('search.greaterthan');
    case '=':
      return intl.get('search.equal');
    default:
      return '';
  }
};

/**
 * 校验数据
 * @param {Array} data 条件数据
 * @param {String} errType 若有误, 点击【添加】提示'请先添加', 点击【筛选】提示'不能为空'
 * @returns [ hasErr, newData ] 返回是 否有错误的标识 和 新数据
 */
const verifyData = (data, errType) => {
  let hasErr = false;
  const newData = data.map(item => {
    const { pro, value = [] } = item;
    const isErr = !pro || !value.length || !value.every(Boolean);

    isErr && (hasErr = true);

    return { ...item, isErr: isErr && errType };
  });

  return [hasErr, newData];
};

const STRING = 'STRING';
const STRING0 = 'string';
const INT = 'INTEGER';
const INT0 = 'integer';
const BOOL = 'BOOLEAN';
const BOOL0 = 'bool';
const DOUBLE = 'DOUBLE';
const DOUBLE0 = 'double';
const FLOAT = 'FLOAT';
const FLOAT0 = 'float';
const DECIMAL = 'DECIMAL';
const DECIMAL0 = 'decimal';
const DATETIME = 'DATETIME';
const DATETIME0 = 'datetime';
const DATE = 'DATE';
const DATE0 = 'date';

/**
 * 默认筛选范围
 * @param {String} proType 属性类型
 */
const getDefaultRange = proType => {
  switch (true) {
    case [STRING, STRING0, BOOL, BOOL0].includes(proType):
      return '=';
    case [INT, DOUBLE, FLOAT, DATE, DECIMAL, DATETIME, INT0, DOUBLE0, FLOAT0, DATE0, DECIMAL0, DATETIME0].includes(
      proType
    ):
      return '~';
    default:
      return '=';
  }
};

export { showRangeType, verifyData, getDefaultRange };
