export const SORTER_MAP: Record<string, string> = {
  descend: 'descend',
  ascend: 'ascend',
  create_time: 'create_time',
  kg_name: 'kg_name',
  edit_time: 'edit_time'
};

export const PC_CONFIG = [
  {
    key: 'toolbar',
    visible: true,
    children: [
      {
        key: 'canvas',
        children: [
          { key: 'undo', name: '撤销', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'redo', name: '重做', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'removeOther', name: '移除其他', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'removeAll', name: '移除全部', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'hide&show', name: '隐藏/取消隐藏', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'zoom', name: '缩放', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'locate', name: '定位', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'fitView', name: '自适应', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'fitCenter', name: '视图居中', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'statistics', name: '统计', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'styleSetting', name: '外观样式', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'layoutSimple', name: '布局切换', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'layout', name: '布局高级设置', alias: '', type: 'default', pKey: 'canvas', checked: true },
          { key: 'canvasSetting', name: '画布设置', alias: '', type: 'default', pKey: 'canvas', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'toolbar',
        name: '画布功能'
      },
      {
        key: 'search',
        children: [
          { key: 'search', name: '搜索', alias: '', type: 'default', pKey: 'search', checked: true },
          { key: 'sql', name: '语句查询', alias: '', type: 'default', pKey: 'search', checked: true },
          { key: 'neighbors', name: '邻居查询', alias: '', type: 'default', pKey: 'search', checked: true },
          { key: 'path', name: '路径查询', alias: '', type: 'default', pKey: 'search', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'toolbar',
        name: '添加搜索工具'
      },
      {
        key: 'algorithm',
        children: [
          { key: 'louvain', name: 'Louvain社区发现', alias: '', type: 'default', pKey: 'algorithm', checked: true },
          { key: 'pageRank', name: 'PageRank', alias: '', type: 'default', pKey: 'algorithm', checked: true },
          { key: 'loopDetection', name: '环检测', alias: '', type: 'default', pKey: 'algorithm', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'toolbar',
        name: '图计算'
      }
    ],
    alias: '',
    type: 'default',
    name: '工具栏'
  },
  {
    key: 'canvasRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'selectAll', name: '选择全部实体/关系', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'deselectNode', name: '取消已选实体', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'deselectEdge', name: '取消已选关系', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'removeAll', name: '移除全部', alias: '', type: 'default', pKey: 'basic', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'canvasRightClick',
        name: '基础功能'
      }
    ],
    alias: '',
    type: 'default',
    name: '画布右键'
  },
  {
    key: 'subgraphRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'remove', name: '移除', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'hide', name: '隐藏', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'subgraph', name: '选中子图', alias: '', type: 'default', pKey: 'basic', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'subgraphRightClick',
        name: '基础功能'
      }
    ],
    alias: '',
    type: 'default',
    name: '子图右键'
  },
  {
    key: 'edgeRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'style', name: '外观样式', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'remove', name: '移除', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'hide', name: '隐藏', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'selectSame', name: '选中相同类', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'subgraph', name: '选中子图', alias: '', type: 'default', pKey: 'basic', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'edgeRightClick',
        name: '基础功能'
      }
    ],
    alias: '',
    type: 'default',
    name: '关系右键'
  },
  {
    key: 'nodeRightClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'style', name: '外观样式', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'fixed', name: '固定当前位置', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'invert', name: '反选', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'remove', name: '移除', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'hide', name: '隐藏', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'selectSame', name: '选中相同类', alias: '', type: 'default', pKey: 'basic', checked: true },
          { key: 'subgraph', name: '选中子图', alias: '', type: 'default', pKey: 'basic', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'nodeRightClick',
        name: '基础功能'
      },
      {
        key: 'extensions',
        children: [
          { key: 'neighbors', name: '邻居查询', alias: '', type: 'default', pKey: 'extensions', checked: true },
          { key: 'path', name: '路径查询', alias: '', type: 'default', pKey: 'extensions', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'nodeRightClick',
        name: '个性化功能'
      }
    ],
    alias: '',
    type: 'default',
    name: '实体右键'
  },
  {
    key: 'nodeDoubleClick',
    children: [
      {
        key: 'basic',
        children: [
          { key: 'neighbors1', name: '一度邻居查询', alias: '', type: 'default', pKey: 'basic', checked: true }
        ],
        alias: '',
        type: 'default',
        pKey: 'nodeDoubleClick',
        name: '基础功能'
      }
    ],
    alias: '',
    type: 'default',
    name: '实体双击功能'
  },
  {
    key: 'features',
    children: [
      { key: 'paramsTool', visible: true },
      { key: 'welcomeMessage', visible: false, content: '' },
      { key: 'resultPanel', visible: false }
    ]
  }
];