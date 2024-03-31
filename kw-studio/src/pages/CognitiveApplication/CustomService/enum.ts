import intl from 'react-intl-universal';
import { TableState } from './types';

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
  env: '-1' // 应用环境过滤条件
};

export const FILTER_OPTION = [
  { key: -1, text: intl.get('cognitiveService.analysis.all') },
  { key: 0, text: intl.get('cognitiveSearch.unpublished') },
  { key: 1, text: intl.get('cognitiveService.analysis.published') },
  { key: 2, text: intl.get('cognitiveService.analysis.publishFailed') }
];

export const FILTER_ENV_OPTION = [
  { key: -1, text: intl.get('customService.all') },
  { key: 0, text: intl.get('customService.basicEnv') },
  { key: 1, text: intl.get('customService.depEnv1') },
  { key: 2, text: intl.get('customService.depEnv2') }
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

export const QUERY_OPTION = [
  { key: -1, text: intl.get('cognitiveService.analysis.all') },
  { key: 1, text: intl.get('cognitiveService.analysis.graphQuery') }
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

export const SORTER_MAP: Record<string, string> = {
  descend: 'descend',
  ascend: 'ascend',
  create_time: 'create_time',
  name: 'name',
  edit_time: 'edit_time'
};
