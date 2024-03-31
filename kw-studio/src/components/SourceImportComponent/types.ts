/**
 * 预览表格列数据
 */
export type PreviewColumn = {
  key: string;
  name: string;
  columns: string[];
  partition?: boolean;
};

/**
 * 后端返回的数据源
 */
export type DsSourceItem = {
  id: number;
  dataType: string;
  data_source: string;
  ds_path: string;
  dsname: string;
  extract_type: string;
  extract_model?: string;
  queue: string;
  host: string;
  json_schema: string;
};

export type ViewRule = 'ds_id' | 'extract_model';
