import { DS_SOURCE, EXTRACT_TYPE } from '@/enums';
import type { NodeConfig, EdgeConfig } from '@antv/g6';

export type G6NodeData = NodeConfig & {
  _sourceData?: any;
};

export type G6EdgeData = EdgeConfig & {
  _sourceData?: any;
};

const DataSourceTypes = [
  DS_SOURCE.mysql,
  DS_SOURCE.sqlserver,
  DS_SOURCE.kingbasees,
  DS_SOURCE.hive,
  DS_SOURCE.as,
  DS_SOURCE.postgresql,
  DS_SOURCE.mq
] as const;
export type DataSourceType = (typeof DataSourceTypes)[number];

const ExtractTypes = [EXTRACT_TYPE.LABEL, EXTRACT_TYPE.MODEL, EXTRACT_TYPE.STANDARD, EXTRACT_TYPE.SQL] as const;
export type ExtractType = (typeof ExtractTypes)[number];

const ExtractModels = [
  'Contractmodel',
  'OperationMaintenanceModel',
  'Anysharedocumentmodel',
  'AImodel',
  'Generalmodel'
] as const;

export type ExtractModel = (typeof ExtractModels)[number];

export type FileType = {
  file_name: string;
  file_path: string;
  file_source: string;
  file_type?: 'file' | 'dir';
  delimiter?: string;
  quotechar?: string;
  escapechar?: string;
  start_time?: any;
  end_time?: any;
  name?: any;
  ds_id?: any;
  data_source?: any;
};

type ExtractRulePropertyType = {
  column_name: string;
  property_field: string;
};

type ExtractRuleType = {
  entity_type: string;
  property: ExtractRulePropertyType[];
};

/**
 * 选中的数据文件类型
 */
export interface DataFileType {
  ds_id: number; // 数据源的id
  data_source: DataSourceType; // 数据源的类型
  ds_path: string;
  extract_type: ExtractType;
  extract_rules: ExtractRuleType[];
  files: FileType[];
  x: number;
  y: number;
  extract_model?: ExtractModel;
  partition_usage?: boolean;
  partition_infos?: Record<string, string>;
}

export type DataFileTypes = DataFileType[];

// 实体

type EntityPropertyMapType = {
  entity_prop: string;
  otl_prop: string;
};

type EntityType = {
  name: string;
  entity_type: string;
  x: number;
  y: number;
  property_map: EntityPropertyMapType[];
};
export type EntityTypes = EntityType[];

// 边

type EdgePropertyMapType = {
  entity_prop: string;
  edge_prop: string;
};

type EdgeRelationMap = {
  begin_class_prop: string;
  equation_begin: string;
  relation_begin_pro: string;
  equation: string;
  relation_end_pro: string;
  equation_end: string;
  end_class_prop: string;
};

interface EdgeType {
  relations: string[];
  entity_type: string;
  property_map: EdgePropertyMapType[];
  relation_map: EdgeRelationMap;
}

export type EdgeTypes = EdgeType[];

export interface GraphKMapType {
  entity: EntityTypes;
  edge: EdgeTypes;
  files: DataFileTypes;
}

export type DataFileErrorsProps = {
  error: string;
  dataFile: DataFileType;
};

export type Flow4ErrorType = {
  name: string; // 实体类/关系类
  attrName?: string; // 字段名，当type为repeat的时候，此属性必有，代表是哪个字段重复映射了
  type: 'required' | 'dataFile' | 'repeat';
  error: string;
  dataFile?: DataFileType;
};
