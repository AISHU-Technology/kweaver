import { TableState } from './types';
import intl from 'react-intl-universal';
// 训练状态的圈的颜色
export const STATUS_COLOR: Record<string, string> = {
  未训练: 'rgba(0,0,0,0.25)', // 未训练
  训练中: '#FAAD14', // 训练中
  训练失败: '#F5222D', // 训练失败
  训练成功: '#52C41A' // 训练成功
};

// 训练状态对应显示名称
export const STATUS_NAME: Record<string, any> = {
  未训练: intl.get('intention.untrained'),
  训练中: intl.get('intention.training'),
  训练失败: intl.get('intention.failed'),
  训练成功: intl.get('intention.success')
};

// 训练状态对应显示名称
export const SELECT_STATUS = [
  { key: -1, name: intl.get('intention.all') },
  { key: intl.get('intention.untrained'), name: intl.get('intention.untrained') },
  { key: intl.get('intention.training'), name: intl.get('intention.training') },
  { key: intl.get('intention.failed'), name: intl.get('intention.failed') },
  { key: intl.get('intention.success'), name: intl.get('intention.success') }
];

/**
 * 操作按钮样式
 */
export const OPERATION_STYLE: any = {
  minWidth: '0px',
  border: 'none',
  background: 'none',
  padding: '4px 0px'
};

export const INIT_STATE: TableState = {
  loading: false, // 搜索加载中
  search_name: '', // 搜索关键字
  page: 1, // 当前页码
  count: 0, // 总数
  order: 'desc', // 时间排序方式
  rule: 'create_time', // 排序规则
  filter_status: '-1' // 状态过滤条件
};

export const SORTER_MENU = [
  {
    key: 'intentpool_name',
    text: intl.get('cognitiveService.analysis.byName')
  },
  {
    key: 'create_time',
    text: intl.get('cognitiveService.analysis.byCreate')
  },
  {
    key: 'edit_time',
    text: intl.get('cognitiveService.analysis.byUpdate')
  }
];
