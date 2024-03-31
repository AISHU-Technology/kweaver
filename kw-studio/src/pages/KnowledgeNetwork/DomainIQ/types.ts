import { CALCULATE_STATUS } from '@/enums';

export type KgInfo = {
  id: number;
  color: string;
  knw_name: string;
  knw_description: string;
  intelligence_score: number;
  recent_calculate_time: string;
  creation_time: string;
  update_time: string;
};

export type TableState = {
  loading: boolean;
  query: string;
  page: number;
  total: number;
  order: string;
  rule: string;
};

export type ListItem = {
  graph_id: number;
  graph_config_id: number;
  graph_name: string;
  calculate_status: keyof typeof CALCULATE_STATUS | string;
  last_task_message: string;
  update_time: string;
  data_repeat_C1: number;
  data_missing_C2: number;
  data_quality_B: number;
  data_quality_score: number;
};

export type RecordOperation = {
  type: 'record' | 'upload' | '';
  visible: boolean;
  data?: KgInfo;
};
