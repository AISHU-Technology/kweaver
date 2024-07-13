import intl from 'react-intl-universal';

/**
 * 图分析服务相关枚举值
 */

const CUSTOM_SEARCH = 'custom-search';
const NEIGHBOR = 'neighbors';
const SHOREST_PATH = 'shortest-path';
const ALL_PATH = 'full-path';

const SEARCH_TYPE = {
  CUSTOM_SEARCH,
  NEIGHBOR,
  SHOREST_PATH,
  ALL_PATH
} as const;

const REST_API = 'restAPI';
const PC_EMBED = 'PC_embed';
const ACCESS_METHOD = {
  REST_API,
  PC_EMBED
} as const;

const SINGLE_LOGIN = 'single_login';
const APPID_LOGIN = 'appid_login';
const PERMISSION = {
  SINGLE_LOGIN,
  APPID_LOGIN
} as const;

const NO_STREAM = 'no_stream';
const STREAM = 'stream';
const TRANS_MODE = {
  NO_STREAM,
  STREAM
} as const;

const textMap: Record<string, string> = {
  [CUSTOM_SEARCH]: 'analysisService.graphLangType',
  [PC_EMBED]: 'analysisService.PCWeb',
  [SINGLE_LOGIN]: 'analysisService.singleLogin',
  [APPID_LOGIN]: 'analysisService.appidLogin',
  [NO_STREAM]: 'analysisService.noStream',
  [STREAM]: 'analysisService.stream',
  [SHOREST_PATH]: 'cognitiveService.analysis.shortestPathQuery',
  [ALL_PATH]: 'cognitiveService.analysis.allPathsQuery',
  [NEIGHBOR]: 'exploreGraph.neighbor'
};
const text = (type: string) => {
  const intlKey = textMap[type];
  return intlKey ? intl.get(intlKey) : '';
};

export const ANALYSIS_SERVICES = {
  text,
  SEARCH_TYPE,
  ACCESS_METHOD,
  PERMISSION,
  TRANS_MODE
};
