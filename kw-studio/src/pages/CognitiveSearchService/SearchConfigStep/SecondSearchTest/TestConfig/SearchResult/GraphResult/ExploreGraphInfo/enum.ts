import intl from 'react-intl-universal';
import { GRAPH_LAYOUT, GRAPH_LAYOUT_DAGRE_DIR } from '@/enums';

export const DEFAULT_CANVAS = {
  key: '0',
  title: '子图探索',
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

export const TOOLBAR = {
  undo: { checked: true },
  redo: { checked: true },
  removeSelected: { checked: true },
  removeOther: { checked: true },
  removeAll: { checked: true },
  'hide&show': { checked: true },
  styleSetting: { checked: true },
  layout: { checked: true },
  algorithm: { checked: true },
  louvain: { checked: true },
  loopDetection: { checked: true },
  pageRank: { checked: true },
  zoom: { checked: true },
  locate: { checked: true },
  fitView: { checked: true },
  fitCenter: { checked: true },
  statistics: { checked: true },
  canvasSetting: { checked: true }
};

export const SEARCH_MENU = {
  search: { checked: true },
  sql: { checked: true },
  neighbors: { checked: true },
  path: { checked: true }
};

export const FEATURES = {
  paramsTool: { visible: false },
  welcomeMessage: { visible: false, content: intl.get('analysisService.welcomeText') }
};

export const MENU = {
  node: {
    click: {
      style: { checked: true },
      fixed: { checked: true },
      invert: { checked: true },
      remove: { checked: true },
      hide: { checked: true },
      selectSame: { checked: true },
      neighbors: { checked: true },
      superNeighbors: { checked: true },
      path: { checked: true },
      subgraph: { checked: true }
      // sliced: { checked: true }
    },
    dblClick: {
      neighbors1: { checked: true }
    }
  },
  edge: {
    style: { checked: true },
    remove: { checked: true },
    hide: { checked: true },
    selectSame: { checked: true },
    subgraph: { checked: true }
    // sliced: { checked: true }
  },
  canvas: {
    selectAll: { checked: true },
    deselectNode: { checked: true },
    deselectEdge: { checked: true },
    removeAll: { checked: true }
  },
  subgraph: {
    remove: { checked: true },
    hide: { checked: true },
    subgraph: { checked: true }
    // sliced: { checked: true }
  }
};
