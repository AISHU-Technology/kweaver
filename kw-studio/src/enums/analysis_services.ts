import intl from 'react-intl-universal';

/**
 * 图分析服务相关枚举值
 */

// 搜索方式
const CUSTOM_SEARCH = 'custom-search'; // 自定义搜索
const NEIGHBOR = 'neighbors'; // 邻居查询
const SHOREST_PATH = 'shortest-path'; // 最短路径
const ALL_PATH = 'full-path'; // 全部路径

const SEARCH_TYPE = {
  CUSTOM_SEARCH,
  NEIGHBOR,
  SHOREST_PATH,
  ALL_PATH
} as const;

// 服务访问方式
const REST_API = 'restAPI'; // API访问
const PC_EMBED = 'PC_embed'; // 网页嵌入
const ACCESS_METHOD = {
  REST_API,
  PC_EMBED
} as const;

// 权限控制
const SINGLE_LOGIN = 'single_login'; // 单点登录
const APPID_LOGIN = 'appid_login'; // 免登录
const PERMISSION = {
  SINGLE_LOGIN,
  APPID_LOGIN
} as const;

// 传输方式
const NO_STREAM = 'no_stream'; // 非流式传输
const STREAM = 'stream'; // 流式传输
const TRANS_MODE = {
  NO_STREAM,
  STREAM
} as const;

// 国际化
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
