import _ from 'lodash';
import { getDefaultConfig, OPTIONS_KEYS } from './enums';

/**
 * 生成最终配置
 * @param totalConfig 所有配置
 * @param selectedKeys 已选的配置
 * @param features 其他散碎的功能配置
 */
export const generateConfig = (
  totalConfig: Record<string, any>,
  selectedKeys: string[],
  features: Record<string, any>
) => {
  const keyMap = _.keyBy(selectedKeys);
  const loop: Function = (origin: any[]) => {
    return _.map(origin, item => {
      const thisItem = { ...item };
      thisItem.key = _.split(item.key, '_').pop();
      _.includes(thisItem.pKey, '_') && (thisItem.pKey = _.split(item.pKey, '_').pop());

      if (thisItem.key === 'toolbar') {
        thisItem.visible = features.toolbar.visible;
      }

      if (_.split(item.key, '_').length === 2) {
        const children = _.map(item.children, c => {
          const curItem = _.cloneDeep(totalConfig[c.key] || c);
          const isCheck = !!keyMap[curItem.key];
          curItem.key = _.split(c.key, '_').pop();
          curItem.pKey = _.split(c.pKey, '_').pop();
          curItem.checked = isCheck;
          return curItem;
        });
        return { ...thisItem, children };
      }

      if (thisItem.children) {
        return { ...thisItem, children: loop(thisItem.children) };
      }
      return thisItem;
    });
  };
  // const optionsConfig = _.filter(totalConfig, c => OPTIONS_KEYS.includes(c.key));
  const optionsConfig: any[] = [];
  _.forEach(_.entries(totalConfig), ([key, value]) => {
    const curKey = _.split(key, '_').pop() || '';
    if (OPTIONS_KEYS.includes(curKey)) {
      optionsConfig.push(_.cloneDeep(value));
    }
  });
  const curOptionsConfig = loop(_.cloneDeep(optionsConfig));

  const featuresConfig = {
    key: 'features',
    children: [
      {
        key: 'paramsTool',
        visible: features.paramsTool.visible
      },
      {
        key: 'welcomeMessage',
        visible: features.welcomeMessage.visible,
        content: features.welcomeMessage.visible ? features.welcomeMessage.content : ''
      },
      {
        key: 'resultPanel',
        visible: features.resultPanel.visible
      }
    ]
  };
  return [...curOptionsConfig, featuresConfig];
};

/**
 * 取回已保存的配置
 */
export const mergeSavedConfig = (savedConfig: any[]) => {
  const defaultFeatures = {
    welcomeMessage: { visible: false, content: '', error: '' },
    paramsTool: { visible: true },
    toolbar: { visible: true },
    resultPanel: { visible: false }
  };
  const keys: string[] = [];
  const savedConfigMap: Record<string, any> = {};

  // 处理原来的数据, 拼接key、是否开启工具栏、是否勾选, 然后建立映射
  const loopChange = (arr: any[], parent: any = {}) => {
    return _.map(arr, item => {
      if (parent.key) {
        item.pKey = parent.key;
        item.key = `${parent.key}_${item.key}`;
      }
      if (item.key === 'toolbar') {
        defaultFeatures.toolbar.visible = item.visible;
      }
      item.checked && keys.push(item.key);
      if (item.children) {
        item.children = loopChange(item.children, item);
      }
      savedConfigMap[item.key] = item;
      return item;
    });
  };
  loopChange(savedConfig);

  // 最终还是以默认配置为模板, 填充原来保存的配置, 这样方便兼容旧版数据
  const { config: defaultConfig } = getDefaultConfig();

  const loopMerge = (arr: any[]) => {
    return _.map(arr, item => {
      const data = savedConfigMap[item.key];
      if (!data || data?.type !== 'default') return item;
      item.alias = data.alias;
      item.bind = data.bind;

      if (_.split(item.key, '_').length === 2) {
        const customConfig = _.filter(data.children, c => c.type === 'custom');
        item.children.push(...customConfig);
      }

      if (item.children) {
        if (item.key === 'nodeDoubleClick_basic') {
          item.children = data.children || [];
        } else {
          item.children = loopMerge(item.children);
        }
      }

      return item;
    });
  };
  loopMerge(defaultConfig);
  // 取回其他散碎功能配置
  if (savedConfigMap.features_welcomeMessage) {
    Object.assign(defaultFeatures.welcomeMessage, _.pick(savedConfigMap.features_welcomeMessage, 'visible', 'content'));
  }
  if (savedConfigMap.features_paramsTool) {
    defaultFeatures.paramsTool.visible = savedConfigMap.features_paramsTool.visible;
  }
  if (savedConfigMap.features_resultPanel) {
    defaultFeatures.resultPanel.visible = savedConfigMap.features_resultPanel.visible;
  }
  return [defaultConfig, keys, defaultFeatures] as const;
};

/**
 * 树结构数据平埔一维数组
 */
export const flatFromTree = (data: any[]) => {
  const result: any[] = [];
  const loop = (node: any) => {
    const { children } = node;
    result.push(node);

    if (children?.length) {
      _.forEach(children, loop);
    }
  };
  _.forEach(data, loop);
  return result;
};

/**
 * 判断配置名是否存在
 * @param config 配置项
 * @param totalConfig 所有配置
 */
export const isNameExisted = (config: any, totalConfig: Record<string, any>) => {
  const configArr = _.values(totalConfig);
  return !!_.find(configArr, c => {
    const hasSame = (c.alias || c.name) === config.name;
    if (config.key) {
      return hasSame && config.key !== c.key && config.bind !== c.key && config.key !== c.bind;
    }
    return hasSame;
  });
};

const checkKeyMap: Record<string, string[]> = {
  nodeRightClick_basic_hide: ['toolbar_canvas_hide&show'],
  edgeRightClick_basic_hide: ['toolbar_canvas_hide&show'],
  subgraphRightClick_basic_hide: ['toolbar_canvas_hide&show']
};
const uncheckKeyMap: Record<string, string[]> = {
  'toolbar_canvas_hide&show': [
    'nodeRightClick_basic_hide',
    'edgeRightClick_basic_hide',
    'subgraphRightClick_basic_hide'
  ]
};
/**
 * 联动勾选
 * 实体/关系右键勾选了【隐藏】，顶部工具栏的【隐藏/取消隐藏】也勾选上；
 * 顶部工具栏的【隐藏/取消隐藏】取消了勾选，那实体/关系的右键【隐藏】也取消勾选
 * @param keys
 */
export const checkRelationKey = (keys: string[]) => {
  const newCheck: Record<string, string> = _.keyBy(keys);
  _.forEach(_.keys(checkKeyMap), key => {
    if (newCheck[key]) {
      _.forEach(checkKeyMap[key], k => (newCheck[k] = k));
    }
  });

  _.forEach(_.keys(uncheckKeyMap), key => {
    if (!newCheck[key]) {
      _.forEach(uncheckKeyMap[key], k => Reflect.deleteProperty(newCheck, k));
    }
  });

  return _.uniq(_.keys(newCheck));
};
