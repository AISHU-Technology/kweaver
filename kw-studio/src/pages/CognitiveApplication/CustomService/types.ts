export type KnwItem = {
  id: number;
  color: string;
  knw_name: string;
  knw_description: string;
  intelligence_score: number;
  recent_calculate_time: string;
  creation_time: string;
  update_time: string;
  __codes?: any[];
};

export type kgData = {
  kg_id: string;
  kg_name: string;
};

export type TableState = {
  loading: boolean;
  query: string;
  page: number;
  count: number;
  order_type: string;
  order_field: string;
  status: number;
  kg_id: string;
  knw_id: string;
  env: string;
};

export type ListItem = {
  id: string;
  status: string | number;
  name: string;
  operation_type: string;
  creater: string;
  create_time: number;
  creater_email: string;
  editor: string;
  edit_time: number;
  access_method: string[];
  editor_email: string;
  description: string;
  document: string;
  kg_name: string;
  kg_id: string;
  env: string;
  __codes?: string[];
};

export type RecordOperation = {
  type: 'record' | 'upload' | '';
  visible: boolean;
  data?: KnwItem;
};
