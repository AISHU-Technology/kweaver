import intl from 'react-intl-universal';
import { TableState } from './types';
import { ANALYSIS_SERVICES } from '@/enums';
const { SEARCH_TYPE } = ANALYSIS_SERVICES;

export const DESC = 'descend' as const;
export const ASC = 'ascend' as const;
export const PAGE_SIZE = 10;
export const INIT_STATE: TableState = {
  loading: false, // 搜索加载中
  query: '', // 搜索关键字
  page: 1, // 当前页码
  count: 0, // 总数
  order_type: 'desc', // 时间排序方式
  order_field: 'create_time', // 排序规则
  status: -1, // 状态过滤条件
  kg_id: '-1',
  knw_id: '-1',
  operation_type: 'all' // 查询方式
};

export const FILTER_OPTION = [
  { key: -1, text: intl.get('cognitiveService.analysis.all') },
  { key: 0, text: intl.get('cognitiveService.analysis.unpublished') },
  { key: 1, text: intl.get('cognitiveService.analysis.published') },
  { key: 2, text: intl.get('cognitiveService.analysis.publishFailed') }
];

export const SORTER_MENU = [
  { key: 'name', text: intl.get('cognitiveService.analysis.byName') },
  { key: 'create_time', text: intl.get('cognitiveService.analysis.byCreate') },
  { key: 'edit_time', text: intl.get('cognitiveService.analysis.byUpdate') }
];

export const STATUS_COLOR: any = {
  0: 'rgba(0,0,0,0.25)', // 未发布
  1: '#52C41A', // 已发布
  2: '#F5222D' // 发布失败
};

export const STATUS_SHOW: any = {
  0: intl.get('cognitiveService.analysis.unpublished'),
  1: intl.get('cognitiveService.analysis.published'),
  2: intl.get('cognitiveService.analysis.publishFailed')
};

// export const QUERY_OPTION = [
//   { key: -1, text: intl.get('cognitiveService.analysis.all') },
//   { key: 1, text: intl.get('cognitiveService.analysis.graphQuery') }
// ];

export const QUERY_OPTION = [
  { key: -1, text: intl.get('cognitiveService.analysis.all'), value: 'all' },
  { key: 1, text: intl.get('cognitiveService.analysis.graphQuery'), value: SEARCH_TYPE?.CUSTOM_SEARCH }, // 图语言查询
  { key: 2, text: intl.get('exploreGraph.neighbor'), value: SEARCH_TYPE?.NEIGHBOR }, // 邻居查询
  { key: 3, text: intl.get('cognitiveService.analysis.shortestPathQuery'), value: SEARCH_TYPE?.SHOREST_PATH }, // 最短路径
  { key: 4, text: intl.get('cognitiveService.analysis.allPathsQuery'), value: SEARCH_TYPE?.ALL_PATH } // 全部路径
];

export const OPERATION_STYLE: any = {
  minWidth: '0px',
  border: 'none',
  background: 'none',
  padding: '4px 0px'
};

export const CANCEL_STYLE: any = {
  minWidth: '55px',
  border: 'none',
  background: 'none',
  padding: '4px 0px'
};
