import _ from 'lodash';
import intl from 'react-intl-universal';

type PCConfig = {
  key: string; // 功能标识
  name: string; // 功能名称
  alias: string; // 功能显示名
  visible?: boolean; // 是否可见, 仅 toolbar工具栏有此字段
  checked?: boolean; // 是否勾选
  level: number; // 层级
  bind?: string; // 点双击配置关联的自定义配置项
  type: 'default' | 'custom' | string; // 内置功能 | 自定义功能
  func?: Record<string, any>; // 自定义功能绑定的函数
  children?: PCConfig; // 子配置项
}[];

// 菜单标题名称映射
const keyIntlMap: Record<string, string> = {
  toolbar: 'toolbar',
  canvasRightClick: 'canvasRightClick',
  subgraphRightClick: 'subgraphRightClick',
  edgeRightClick: 'edgeRightClick',
  nodeRightClick: 'nodeRightClick',
  nodeDoubleClick: 'nodeDoubleClick',
  toolbar_canvas: 'canvasT',
  toolbar_search: 'searchT',
  basic: 'basicT',
  extensions: 'extensionsT'
};

/**
 * 显示标题
 * @param key 配置的key
 */
export const showTitle = (key: string) => {
  let _key = key;
  // 兼容代码
  // 2.0.1.9 及以后版本 删除以下代码
  // if (_key === 'toolbar_canvas_layout') _key = 'toolbar_canvas_layoutSimple';
  if (_key === 'toolbar_canvas_advancedLayout') _key = 'toolbar_canvas_layout';
  // 2.0.1.9 及以后版本 删除以上代码
  if (keyIntlMap[_key]) return intl.get(`canvas.${keyIntlMap[_key]}`).d(_key);
  const keyFix = _.split(_key, '_').pop()!;
  if (keyIntlMap[keyFix]) return intl.get(`canvas.${keyIntlMap[keyFix]}`).d(keyFix);
  if (_key.includes('pageRank')) return 'PageRank';
  return intl.get(`canvas.${keyFix}`).d(keyFix);
};

const defaultConfig = [
  // 顶部工具栏
  {
    key: 'toolbar',
    visible: true,
    children: [
      {
        key: 'canvas',
        children: [
          { key: 'undo', name: '撤销' },
          { key: 'redo', name: '重做' },
          { key: 'removeOther', name: '移除其他' },
          { key: 'removeAll', name: '移除全部' },
          { key: 'hide&show', name: '隐藏/取消隐藏' },
          { key: 'zoom', name: '缩放' },
          { key: 'locate', name: '定位' },
          { key: 'fitView', name: '自适应' },
          { key: 'fitCenter', name: '视图居中' },
          { key: 'statistics', name: '统计' },
          { key: 'styleSetting', name: '外观样式' },
          { key: 'layoutSimple', name: '布局切换' },
          { key: 'layout', name: '布局高级设置' },
          { key: 'canvasSetting', name: '画布设置' } // release-2.0.1.5暂时隐藏
          // { key: 'save', name: '快照' },
          // { key: 'downloadImage', name: '截图' },
          // { key: 'sliced', name: '图切片' },
          // { key: 'simpleSearch', name: '搜索' },
          // { key: 'simpleSql', name: '语句查询' },
          // { key: 'simpleNeighbors', name: '邻居查询' },
          // { key: 'simplePath', name: '路径查询' }
        ]
      },
      {
        key: 'search',
        children: [
          { key: 'search', name: '搜索' },
          { key: 'sql', name: '语句查询' },
          { key: 'neighbors', name: '邻居查询' },
          { key: 'path', name: '路径查询' }
        ]
      },
      {
        key: 'algorithm',
        children: [
          { key: 'louvain', name: 'Louvain社区发现' },
          { key: 'pageRank', name: 'PageRank' }, // 先注释掉，2.0.1.9再打开
          { key: 'loopDetection', name: '环检测' }
        ]
      }
    ]
  },
  // 画布右键
  {
    key: 'canvasRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'selectAll', name: '选择全部实体/关系' },
          { key: 'deselectNode', name: '取消已选实体' },
          { key: 'deselectEdge', name: '取消已选关系' },
          { key: 'removeAll', name: '全部移除' }
        ]
      }
    ]
  },
  // 子图右键
  {
    key: 'subgraphRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'remove', name: '移除' },
          { key: 'hide', name: '隐藏' },
          { key: 'subgraph', name: '选中子图' }
          // { key: 'sliced', name: '图切片' }
        ]
      }
    ]
  },
  // 边类右键
  {
    key: 'edgeRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'style', name: '外观样式' },
          { key: 'remove', name: '移除' },
          { key: 'hide', name: '隐藏' },
          { key: 'selectSame', name: '选中相同类' },
          { key: 'subgraph', name: '选中子图' }
          // { key: 'sliced', name: '图切片' }
        ]
      }
    ]
  },
  // 点类右键
  {
    key: 'nodeRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'style', name: '外观样式' },
          { key: 'fixed', name: '固定当前位置' },
          { key: 'invert', name: '反选' },
          { key: 'remove', name: '移除' },
          { key: 'hide', name: '隐藏' },
          { key: 'selectSame', name: '选中相同类' },
          { key: 'subgraph', name: '选中子图' }
          // { key: 'sliced', name: '图切片' }
        ]
      },
      {
        key: 'extensions',
        children: [
          { key: 'neighbors', name: '邻居查询' },
          { key: 'path', name: '路径探索' }
        ]
      }
    ]
  },
  // 点类双击
  {
    key: 'nodeDoubleClick',
    children: [
      {
        key: 'basic',
        children: [{ key: 'neighbors1', name: '一度邻居查询' }]
      }
    ]
  },
  // 功能设置
  {
    key: 'features',
    children: [
      // {
      //   key: 'welcomeMessage',
      //   name: '欢迎语',
      //   visible: false,
      //   content: ''
      // },
      {
        key: 'paramsTool',
        name: '查询参数',
        visible: true
      },
      {
        key: 'resultPanel',
        name: '展示结果面板',
        visible: false
      }
    ]
  }
];

/**
 * 这几个配置通过复选框勾选, 且属于release-2.0.1.8版本之前的功能,
 * 后续版本交互变更, 配置数据结构无法轻易变动, 处理时需要过滤下面的功能单独处理
 */
const OPTIONS_KEYS = [
  'toolbar',
  'canvasRightClick',
  'subgraphRightClick',
  'edgeRightClick',
  'nodeRightClick',
  'nodeDoubleClick'
];

let defaultNodeDoubleClick: any = {};

const getDefaultConfig = () => {
  const config = _.cloneDeep(defaultConfig);
  const selectedKeys: string[] = [];
  const loop = (data: any, level = 1, parent: any = {}) => {
    data.alias = '';
    data.type = 'default';
    if (parent.key) {
      data.pKey = parent.key;
      data.key = `${parent.key}_${data.key}`;
    }
    data.name = showTitle(data.key);
    data.children && data.children.forEach((d: any) => loop(d, level + 1, data));

    // WARNING 点类双击配置比较特殊, 先这么缓存
    if (data.key === 'nodeDoubleClick_basic_neighbors1') {
      defaultNodeDoubleClick = _.cloneDeep(data);
    }

    // [bug 465236] 顶部工具栏选项默认都勾选
    if (level === 3 && _.includes(OPTIONS_KEYS, data.key?.split('_')?.[0])) {
      // if (level === 3 && _.startsWith(data.key, 'toolbar')) {
      selectedKeys.push(data.key);
    }
  };
  config.forEach(c => loop(c));
  return { config, selectedKeys };
};

export { getDefaultConfig, keyIntlMap, defaultNodeDoubleClick, OPTIONS_KEYS };
