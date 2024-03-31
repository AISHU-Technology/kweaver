/**
 * 表格数据类型
 */
export type TableType = {
  name: string;
  id: number;
  status: number;
  creator: string;
  create_time: number;
  end_creator: string;
  end_time: number;
  description: string;
};

export type KnwItem = {
  id: number;
  color: string;
  knw_name: string;
  knw_description: string;
  intelligence_score: number;
  recent_calculate_time: string;
  creation_time: string;
  update_time: string;
};
/**
 * 表格参数状态
 */
export type TableState = {
  loading: boolean;
  search_name: string;
  page: number;
  count: number;
  order: string;
  rule: string;
  filter_status: string;
};
