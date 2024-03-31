// eslint-disable-next-line max-lines
import { GRAPH_LAYOUT, ANALYSIS_SERVICES, GRAPH_LAYOUT_DAGRE_DIR } from '@/enums';

const { ACCESS_METHOD, PERMISSION } = ANALYSIS_SERVICES;

export const name = [];
export const basicData = {
  id: '11',
  name: 'name',
  description: '',
  knw_id: 11,
  knw_name: 'name',
  kg_id: 1,
  kg_name: 'name',
  operation_type: 'custom-search',
  access_method: [], // 访问方式
  permission: '', // 权限控制
  pc_configure_item: [], // PC配置
  action: 'init' // 更新的动作标识
};

export const DEFAULT_CANVAS = {
  key: '0',
  title: '图分析服务',
  graph: null,
  source: null,
  width: 0,
  componentOrigin: 'AnalysisServiceConfig',
  detail: {
    authorKgView: true
  },
  graphConfig: { hasLegend: true, color: 'white', image: 'empty' },
  layoutConfig: {
    key: GRAPH_LAYOUT.FORCE,
    default: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG,
    [GRAPH_LAYOUT.FORCE]: GRAPH_LAYOUT_DAGRE_DIR.DEFAULT_CONFIG
  }
};

export const DEFAULT_CONFIG: any = {
  operation_type: 'custom-search',
  canvas_config: JSON.stringify({ key: GRAPH_LAYOUT.FORCE }),
  canvas_body: '',
  permission: PERMISSION.APPID_LOGIN
};

export const iframeConfig = {
  toolbar: {
    key: 'toolbar',
    visible: true,
    alias: '',
    type: 'default',
    name: '工具栏',
    options: {
      canvas: {
        key: 'canvas',
        alias: '',
        type: 'default',
        pKey: 'toolbar',
        name: '画布功能',
        options: {
          undo: {
            key: 'undo',
            name: '撤销',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          redo: {
            key: 'redo',
            name: '重做',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          removeOther: {
            key: 'removeOther',
            name: '移除其他',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          removeAll: {
            key: 'removeAll',
            name: '移除全部',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          'hide&show': {
            key: 'hide&show',
            name: '隐藏/取消隐藏',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          zoom: {
            key: 'zoom',
            name: '缩放',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          locate: {
            key: 'locate',
            name: '定位',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          fitView: {
            key: 'fitView',
            name: '自适应',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          fitCenter: {
            key: 'fitCenter',
            name: '视图居中',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          statistics: {
            key: 'statistics',
            name: '统计',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          styleSetting: {
            key: 'styleSetting',
            name: '外观样式',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: true
          },
          layoutSimple: {
            key: 'layoutSimple',
            name: '布局切换',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: true
          },
          layout: {
            key: 'layout',
            name: '布局高级设置',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: true
          },
          canvasSetting: {
            key: 'canvasSetting',
            name: '画布设置',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          save: {
            key: 'save',
            name: '快照',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          downloadImage: {
            key: 'downloadImage',
            name: '截图',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          sliced: {
            key: 'sliced',
            name: '图切片',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          simpleSearch: {
            key: 'simpleSearch',
            name: '搜索',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          simpleSql: {
            key: 'simpleSql',
            name: '语句查询',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          simpleNeighbors: {
            key: 'simpleNeighbors',
            name: '邻居查询',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          simplePath: {
            key: 'simplePath',
            name: '路径查询',
            alias: '',
            type: 'default',
            pKey: 'canvas',
            checked: false
          },
          algorithm: {
            key: 'algorithm',
            alias: '',
            type: 'default',
            pKey: 'toolbar',
            name: '图计算',
            checked: false
          },
          louvain: {
            key: 'louvain',
            name: 'Louvain社区发现',
            alias: '',
            type: 'default',
            pKey: 'algorithm',
            checked: false
          },
          pageRank: {
            key: 'pageRank',
            name: 'PageRank',
            alias: '',
            type: 'default',
            pKey: 'algorithm',
            checked: false
          },
          loopDetection: {
            key: 'loopDetection',
            name: '环检测',
            alias: '',
            type: 'default',
            pKey: 'algorithm',
            checked: false
          }
        }
      },
      search: {
        key: 'search',
        alias: '',
        type: 'default',
        pKey: 'toolbar',
        name: '添加搜索工具',
        options: {
          search: {
            key: 'search',
            name: '搜索',
            alias: '',
            type: 'default',
            pKey: 'search',
            checked: false
          },
          sql: {
            key: 'sql',
            name: '语句查询',
            alias: '',
            type: 'default',
            pKey: 'search',
            checked: false
          },
          neighbors: {
            key: 'neighbors',
            name: '邻居查询',
            alias: '',
            type: 'default',
            pKey: 'search',
            checked: false
          },
          path: {
            key: 'path',
            name: '路径查询',
            alias: '',
            type: 'default',
            pKey: 'search',
            checked: false
          }
        }
      },
      algorithm: {
        key: 'algorithm',
        alias: '',
        type: 'default',
        pKey: 'toolbar',
        name: '图计算',
        options: {
          louvain: {
            key: 'louvain',
            name: 'Louvain社区发现',
            alias: '',
            type: 'default',
            pKey: 'algorithm',
            checked: false
          },
          pageRank: {
            key: 'pageRank',
            name: 'PageRank',
            alias: '',
            type: 'default',
            pKey: 'algorithm',
            checked: false
          },
          loopDetection: {
            key: 'loopDetection',
            name: '环检测',
            alias: '',
            type: 'default',
            pKey: 'algorithm',
            checked: false
          }
        }
      }
    }
  },
  canvasRightClick: {
    key: 'canvasRightClick',
    alias: '',
    type: 'default',
    name: '画布右键',
    options: {
      basic: {
        key: 'basic',
        alias: '',
        type: 'default',
        pKey: 'canvasRightClick',
        name: '基础功能',
        options: {
          selectAll: {
            key: 'selectAll',
            name: '选择全部实体/关系',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          deselectNode: {
            key: 'deselectNode',
            name: '取消已选实体',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          deselectEdge: {
            key: 'deselectEdge',
            name: '取消已选关系',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          removeAll: {
            key: 'removeAll',
            name: '移除全部',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          }
        }
      }
    }
  },
  subgraphRightClick: {
    key: 'subgraphRightClick',
    alias: '',
    type: 'default',
    name: '子图右键',
    options: {
      basic: {
        key: 'basic',
        alias: '',
        type: 'default',
        pKey: 'subgraphRightClick',
        name: '基础功能',
        options: {
          remove: {
            key: 'remove',
            name: '移除',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          hide: {
            key: 'hide',
            name: '隐藏',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          subgraph: {
            key: 'subgraph',
            name: '选中子图',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          sliced: {
            key: 'sliced',
            name: '图切片',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          }
        }
      }
    }
  },
  edgeRightClick: {
    key: 'edgeRightClick',
    alias: '',
    type: 'default',
    name: '关系右键',
    options: {
      basic: {
        key: 'basic',
        alias: '',
        type: 'default',
        pKey: 'edgeRightClick',
        name: '基础功能',
        options: {
          style: {
            key: 'style',
            name: '外观样式',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          remove: {
            key: 'remove',
            name: '移除',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          hide: {
            key: 'hide',
            name: '隐藏',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          selectSame: {
            key: 'selectSame',
            name: '选中相同类',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          subgraph: {
            key: 'subgraph',
            name: '选中子图',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          sliced: {
            key: 'sliced',
            name: '图切片',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          }
        }
      }
    }
  },
  nodeRightClick: {
    key: 'nodeRightClick',
    alias: '',
    type: 'default',
    name: '实体右键',
    options: {
      basic: {
        key: 'basic',
        alias: '',
        type: 'default',
        pKey: 'nodeRightClick',
        name: '基础功能',
        options: {
          style: {
            key: 'style',
            name: '外观样式',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          fixed: {
            key: 'fixed',
            name: '固定当前位置',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          invert: {
            key: 'invert',
            name: '反选',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          remove: {
            key: 'remove',
            name: '移除',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          hide: {
            key: 'hide',
            name: '隐藏',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          selectSame: {
            key: 'selectSame',
            name: '选中相同类',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          subgraph: {
            key: 'subgraph',
            name: '选中子图',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          },
          sliced: {
            key: 'sliced',
            name: '图切片',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          }
        }
      },
      extensions: {
        key: 'extensions',
        alias: '',
        type: 'default',
        pKey: 'nodeRightClick',
        name: '拓展功能',
        options: {
          neighbors: {
            key: 'neighbors',
            name: '邻居查询',
            alias: '',
            type: 'default',
            pKey: 'extensions',
            checked: false
          },
          path: {
            key: 'path',
            name: '路径查询',
            alias: '',
            type: 'default',
            pKey: 'extensions',
            checked: false
          }
        }
      }
    }
  },
  nodeDoubleClick: {
    key: 'nodeDoubleClick',
    alias: '',
    type: 'default',
    name: '实体双击功能',
    options: {
      basic: {
        key: 'basic',
        alias: '',
        type: 'default',
        pKey: 'nodeDoubleClick',
        name: '基础功能',
        options: {
          neighbors1: {
            key: 'neighbors1',
            name: '一度邻居查询',
            alias: '',
            type: 'default',
            pKey: 'basic',
            checked: false
          }
        }
      }
    }
  },
  features: {
    key: 'features',
    options: {
      paramsTool: {
        key: 'paramsTool',
        visible: true
      },
      welcomeMessage: {
        key: 'welcomeMessage',
        visible: false,
        content: ''
      },
      resultPanel: {
        key: 'resultPanel',
        visible: false
      }
    }
  }
};
