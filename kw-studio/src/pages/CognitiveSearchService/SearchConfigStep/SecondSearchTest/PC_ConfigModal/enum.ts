import intl from 'react-intl-universal';
import { GRAPH_LAYOUT, GRAPH_LAYOUT_DAGRE_DIR } from '@/enums';

export const CLOSE_WIDTH = 55;
export const MIN_WIDTH = 440;
export const MAX_WIDTH = 1060;

export const ERROR: Record<string, string> = {
  'AlgServer.KGIDErr': 'exploreGraph.deleteGraph',
  'AlgServer.ConfigStatusErr': 'exploreGraph.noSearchable',
  'AlgServer.VClassErr': 'exploreGraph.notExist',
  'AlgServer.VProErr': 'exploreGraph.entityAttribute',
  'Cognitive.StatementTypeIsText': 'cognitiveService.analysis.statementError'
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

export const TOOLBAR = {
  undo: { checked: true },
  redo: { checked: true },
  removeOther: { checked: true },
  removeAll: { checked: true },
  'hide&show': { checked: true },
  styleSetting: { checked: true },
  layout: { checked: true },
  algorithm: { checked: true },
  louvain: { checked: true },
  loopDetection: { checked: true },
  pageRank: { checked: true },
  sliced: { checked: true },
  zoom: { checked: true },
  locate: { checked: true },
  fitView: { checked: true },
  fitCenter: { checked: true },
  statistics: { checked: true },
  canvasSetting: { checked: true },
  downloadImage: { checked: true }
};

export const SEARCH_MENU = {
  search: { checked: true },
  sql: { checked: true },
  neighbors: { checked: true },
  path: { checked: true }
};

export const FEATURES = {
  paramsTool: { visible: true },
  welcomeMessage: { visible: false, content: intl.get('analysisService.welcomeText') }
};
