/* eslint-disable */
/**
 * 若第三步、第四步选择文档知识模型，融合处，文档知识模型中的点类和边类，属性设置增加默认属性，用户也可手动修改
 *   1. folder：gns，
 *   2. document：gns
 *   3. chapter：name、path、level
 *   5. label：name, adlabel_kcid
 */

const AS_MODEL = 'Anysharedocumentmodel'; // 标记文档知识模型的固定字段
const modelSpot = ['folder', 'document', 'chapter', 'label']; // 文档知识模型需要增加配置的点

/**
 * 生成配置
 * @param {String} name 点类名称
 * @param {Boolean} isSpecial 是否包含文档知识模型, 进行特殊处理
 */
const createPro = (name, isSpecial) => {
  const defaultPro = { property: 'name', function: 'equality' };

  if (isSpecial && (name === 'folder' || name === 'document')) {
    return [{ property: 'gns', function: 'equality' }];
  }

  if (isSpecial && name === 'chapter') {
    return [{ ...defaultPro }, { property: 'path', function: 'equality' }, { property: 'level', function: 'equality' }];
  }

  if (isSpecial && name === 'label') {
    return [{ ...defaultPro }, { property: 'adlabel_kcid', function: 'equality' }];
  }

  return [{ ...defaultPro }];
};

/**
 * 判断第三步和第四步是否都使用了AnyShare文档知识模型
 * @param {Array} entity 第三步的数据
 * @param {Array} extr 第四步的数据
 */
const isDocment = (entity, extr) => {
  let flag = false;

  const isEntityHas = entity.some(item => item.model === AS_MODEL);
  const isExtrHas = extr.some(item => item.extract_model === AS_MODEL);

  isEntityHas && isExtrHas && (flag = true);

  return flag;
};

/**
 * 初始化配置
 * @param {Array} entity 点类数据
 * @param {Boolean} isDocModel 是否使用了文档知识模型
 */
const initConfig = (entity, isDocModel) => {
  const data = entity.reduce((pre, cur) => {
    const { colour, name, properties, model, alias } = cur;
    const isSpecial = isDocModel && model === AS_MODEL && modelSpot.includes(name);

    pre.push({
      colour: colour,
      name: name,
      properties: createPro(name, isSpecial),
      attrList: properties.map(pro => pro[0]),
      alias
    });

    return pre;
  }, []);

  return data;
};

/**
 * 更新配置
 * @param {Array} origin 原配置数据
 * @param {Array} onto 新的第三步数据
 * @param {Boolean} isDocModel 是否使用了文档知识模型
 */
const updateConfig = (origin, onto, isDocModel) => {
  const oldData = origin[0].entity_classes;

  const data = onto.reduce((pre, cur) => {
    const { colour, name, properties, model, alias } = cur;
    const newAttrList = properties.map(pro => pro[0]);
    const index = oldData.findIndex(item => item.name === name);
    const isSpecial = isDocModel && model === AS_MODEL && modelSpot.includes(name);

    if (index === -1) {
      // 新增
      pre.push({
        colour: colour,
        name: name,
        properties: createPro(name, isSpecial),
        attrList: newAttrList,
        alias
      });
    } else {
      // 更新
      let repeatPro = []; // 原数据可能重复
      let oldPro = [...oldData[index].properties];

      const newPro = oldPro.filter(item => {
        const { property } = item;

        if (newAttrList.includes(property) && !repeatPro.includes(property)) {
          repeatPro.push(property);
          return true;
        }

        return false;
      });

      pre.push({
        colour: colour,
        name: name,
        properties: newPro,
        attrList: newAttrList,
        alias
      });
    }

    return pre;
  }, []);

  return data;
};

export { isDocment, initConfig, updateConfig };
