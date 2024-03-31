/**
 * 参数, 自定义字段时最好用下划线前缀区分
 */
export type ParamItem = {
  _id: string;
  _text?: string;
  _type?: string;
  _order?: any;
  name: string;
  example?: string;
  alias?: string;
  description?: string;
  position?: any[];
  param_type?: 'entity' | 'string' | string;
  options?: 'single' | 'multiple' | string;
  entity_classes?: any[]; // 分析服务配置实体类需要选择类
  [key: string]: any;
};

/**
 * 字符的位置, `line` 行数, `ch`: 索引
 */
export type Pos = { line: number; ch: number };

/**
 * 替换的规则
 */
export type FormatRule = (param: Record<string, any>) => string;
