// 提示词信息
export type TPromptInfo = {
  prompt_item_id: string;
  prompt_item_type_id: string;
  prompt_id: string;
  icon: string | number;
  prompt_name: string;
  prompt_item_type: string;
  prompt_type: 'chat' | 'completion' | string;
  model_id: string;
  model_name: string;
  model_series: string;
  prompt_desc: string;
  prompt_deploy: boolean;
  messages: string;
  opening_remarks: string;
  variables: TVariables;
  model_para: TModelParams;
};

// 变量
export type TVariables = {
  id: string;
  var_name: string;
  field_name: string;
  optional: boolean;
  field_type: 'text' | 'textarea' | 'selector' | 'number' | string;
  value_type?: 'i' | 'f' | string;
  max_len?: number;
  options?: string[];
  range?: number[];
  input?: string;
  error?: Record<string, string>;
}[];

export type TEnhanceConfig = {
  prologue: string;
};

// 对话信息
export type TChatInfo = {
  id: string;
  status: string;
  role: 'ai' | 'human' | string;
  message: any;
  timestamp: string;
  token_len?: number;
  time?: number;
}[];

// 模板
export type TTemplates = {
  prompt_id: string;
  prompt_name: string;
  prompt_desc: string;
  model_id: string;
  model_name: string;
  model_para: any;
  messages: string;
  opening_remarks: string;
  variables: {
    var_name: string;
    field_name: string;
    optional: boolean;
    field_type: string;
    max_len: 48;
    options: string[];
    value_type: string;
    range: number[];
  }[];
  [key: string]: any;
}[];

// 模型参数
export type TModelParams = {
  temperature: number;
  top_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  max_tokens: number;
  [key: string]: number;
};

// 对话历史
export type TChatHistory = {
  role: 'human' | 'ai' | string;
  message: string;
}[];

// 模型运行时的配置
export type TRuntimeOptions = {
  model_id: string;
  // enhanceConfig: TEnhanceConfig;
  model_para: TModelParams;
  messages: string;
  inputs: Record<string, any>;
  variables?: TVariables;
};

export type ProjectItem = {
  prompt_item_id: string;
  prompt_item_name: string;
  prompt_item_types: { id: string; name: string }[];
  create_by: string;
  update_by: string;
  create_time: string | number;
  update_time: string | number;
};
