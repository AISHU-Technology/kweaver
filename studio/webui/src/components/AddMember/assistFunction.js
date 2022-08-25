/**
 * 更新表格数据的权限
 * @param {Number} id 用户id
 * @param {Number} proId 属性id
 * @param {Array} data 表格数据
 */
const updateTable = (id, proId, data) => {
  const newData = data.reduce((res, item) => {
    (item.accountId === id) && (item.proId = proId);
    res.push(item);

    return res;
  }, []);

  return newData;
};

/**
 * 更新已选择项, 仅更新属性或新增, 不删除, 不然界面数据跳动
 * @param {Number} id 行id
 * @param {Number} proId 属性id
 * @param {Array} data 原来已选择项的数据
 * @param {Object} newPro 新增的选择项
 */
const updateChecked = (id, proId, data, newPro = null) => {
  const index = data.findIndex(item => item.accountId === id);

  // 新增
  if (index === -1) {
    const newData = [...data, newPro];

    // 按首字母排序
    try {
      newData.sort((a, b) => a.accountName.localeCompare(b.accountName, 'pinyin'));
    } catch (err) { return newData; }

    return newData;
  }

  // 修改
  const dataCopy = [...data];

  if (proId) {
    dataCopy[index].proId = proId;
  } else {
    dataCopy.splice(index, 1);
  }

  return dataCopy;
};

/**
 * 手动添加权限id字段(proId), 如果已经有了配置过的数据, 覆盖接口返回数据的权限值
 * @param {Array} result 接口返回的数据
 * @param {Array} checkedData 仅查看已选择项的数据
 */
const coverResult = (result, checkedData) => {
  const newResult = result.reduce((res, item) => {
    const { accountId } = item;
    const index = checkedData.findIndex(check => check.accountId === accountId);

    item.proId = 0;
    index !== -1 && (item.proId = checkedData[index].proId);

    res.push(item);

    return res;
  }, []);

  return newResult;
};

/**
 * 生成接口body参数
 * @param {Array} checkedData 选择的数据
 */
const generateBody = checkedData => {
  const curData = checkedData.filter(item => item.proId);
  const body = curData.map(item => ({ account_id: item.accountId, property_id: item.proId }));

  return body;
};

/**
 * 判断该用户能操作的权限属性
 * 权限 { 1: '所有者', 2: '管理者', 3: '编辑者', 4: '查看者' }
 * 用户类型{ 0: 'admin', 1: '普通用户', 2: '知识网络管理员' }
 * @param {Number} type 用户类型
 * @param {Number} level 当前登录用户对于此图谱的权限
 */
const boolPermitPro = (type, level) => {
  if (type === 0) {
    return [1, 2, 3, 4];
  }

  if (type === 1) {
    return [4];
  }

  if (type === 2) {
    if (level === 1) {
      return [1, 2, 3, 4];
    }

    return [2, 3, 4];
  }

  return [];
};

export {
  updateTable,
  updateChecked,
  coverResult,
  generateBody,
  boolPermitPro
};
