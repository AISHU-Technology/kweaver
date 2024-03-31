/**
 * 抽取源
 */
export type ExtractItem = {
  sqlFileRepeatName?: boolean; // 当前sql 文件是否与同一数据源下的非sql文件重名
  selfId: string; // 前端添加的唯一标识
  forceUpdate?: number; // 强制更新
  celery_task_id?: 'string'; // 预测任务id
  ds_name: string; // 数据源名
  ds_id: number; // 数据源id
  data_source: string; // 数据源类型, mysql、as7 ...
  ds_path: string; // 数据源根路径
  file_source: string; // 文件标识, 数据库表名 | as的gns
  file_name: string; // 数据库表名 | 文件名
  file_path: string; // 数据库名 | 文件路径
  file_type: string; // 文件类型, 数据库无意义字段, 'dir' | 'file'
  extract_type: string; // 抽取方式
  extract_model?: string; // 抽取模型
  // 抽取规则列表
  extract_rules: {
    is_model: 'from_model' | 'not_model' | string; // 是否是模型
    entity_type: string; // 抽取对象
    property: {
      property_field: string; // 抽取对象属性名(去除特殊字符)
      column_name: string; // 抽取对象属性原始名称, 用于显示
      property_func: string; // 抽取规则, 目前仅 'All'
    };
  }[];
};

/**
 * 预览表格列数据
 */
export type PreviewColumn = {
  key: string;
  name: string;
  columns: string[];
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
