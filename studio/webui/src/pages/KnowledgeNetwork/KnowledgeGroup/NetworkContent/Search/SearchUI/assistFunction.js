/**
 * 判断当前页全选、半选状态
 * @param {Array} selectData 选中的数据
 * @param {Array} resData 列表数据
 * @param {Array} disabledData 禁用数据
 */
const boolCheckStatus = (selectData, resData, disabledData) => {
  if (!resData.length || ![...selectData, ...disabledData].length) return { isAll: false, isPart: false };

  const mapData = new Map();
  let count = 0;

  selectData.forEach(item => mapData.set(item.id, { flag: 'select' }));
  disabledData.forEach(item => mapData.set(item.id, { flag: 'disabled' }));

  for (let i = 0; i < resData.length; i++) {
    const { id } = resData[i];

    mapData.get(id) && (count += 1);

    // 同时存在勾选和不勾选, 必然是半选
    if (!mapData.get(id) && count) {
      return { isAll: false, isPart: true };
    }
  }

  const isAll = count === resData.length;
  const isPart = count && count < resData.length;
  const isDisabled = isAll && resData.every(d => {
    const temp = mapData.get(d.id);

    return temp && temp.flag === 'disabled';
  });

  return { isAll, isPart, isDisabled };
};

/**
 * 全选去重
 * @param {Array} selectData 选中的数据
 * @param {Array} resData 列表数据
 * @param {Boolean} isReverse 是否反选
 * @param {Array} disabledData 禁用数据
 */
const checkAllData = (selectData, resData, isReverse, disabledData) => {
  const selectMap = new Map();
  const disabledMap = new Map();

  selectData.forEach(item => selectMap.set(item.id, true));
  disabledData.forEach(item => disabledMap.set(item.id, true));

  const abledData = resData.filter(({ id }) => !disabledMap.get(id)); // 当前页可选的数据

  if (isReverse) {
    const revData = selectData.filter(({ id }) => !abledData.find(item => item.id === id));

    return revData;
  }

  const excludeData = abledData.reduce((res, item) => selectMap.get(item.id) ? res : [...res, item], []);

  return [...selectData, ...excludeData];
};

/**
 * 条件转换
 * @param {String} type 条件类型
 */
const switchCondition = type => {
  switch (type) {
    case '=':
      return 'eq';
    case '>':
      return 'gt';
    case '<':
      return 'lt';
    case '~':
      return 'between';
    default:
      return 'eq';
  }
};

/**
 * 处理筛选条件标签
 * @param {Array} tags 筛选条件
 */
const handleTags = tags => {
  return tags.map(item => ({
    property: item.pro,
    pt: item.type,
    condition: switchCondition(item.rangeType),
    range: item.value
  }));
};

export { boolCheckStatus, checkAllData, handleTags };
