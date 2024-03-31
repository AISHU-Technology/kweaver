import intl from 'react-intl-universal';

export const INIT_STATE = {
  loading: false, // 数据加载的loading
  testLoadingId: '', // 测试连接的数据id
  viewType: 'card',
  page: 1,
  total: 0,
  name: '',
  order: 'descend',
  rule: 'create_time',
  series: 'all'
};
export type TableState = typeof INIT_STATE;
export const stateReducer = (state: TableState, action: Partial<TableState>) => ({ ...state, ...action });
export const SORTER_MENU = [
  { key: 'create_time', label: intl.get('llmModel.byCreate') },
  { key: 'update_time', label: intl.get('llmModel.byUpdate') },
  { key: 'model_name', label: intl.get('llmModel.byName') }
];
export const FILTER_OPTION = [
  { key: 'all', value: 'all', label: intl.get('global.all') },
  { key: 'openai', value: 'openai', label: 'OpenAI' },
  { key: 'aishu-baichuan', value: 'aishu-baichuan', label: 'aishu-baichuan' },
  { key: 'aishu-Qwen', value: 'aishu-Qwen', label: 'aishu-Qwen' }
];
export const MODEL_SUPPLIER: Record<string, any> = {
  openai: 'OpenAI',
  'aishu-baichuan': 'aishu-baichuan'
};
export const OPERATE_ITEMS = [
  { key: 'check', label: intl.get('global.check') },
  { key: 'edit', label: intl.get('global.edit') },
  { key: 'test', label: intl.get('global.test') }
  // { key: 'delete', label: intl.get('global.delete') }
  // { key: 'deploy', label: '发布部署' }
  // { key: 'auth', label: '权限管理' }
];

// @Release-3.0.0.1 OpenAI模型配置内置, 手动声明其表单配置
export const OPENAI_CONFIG: Record<string, any> = {
  openai: {
    _model: 'openai',
    title: 'OpenAI',
    icon: '',
    formData: [
      {
        field: 'model_config.api_key',
        component: 'input',
        type: 'string',
        label: 'API key',
        placeholder: {
          'zh-CN': '请输入',
          'en-US': 'Please enter'
        },
        rules: [
          {
            required: true,
            message: { 'zh-CN': '此项不允许为空', 'en-US': 'The value cannot be null' }
          },
          {
            pattern: '^[a-zA-Z0-9!-~]+$',
            message: {
              'zh-CN': '仅支持输入英文、数字及键盘上的特殊字符号',
              'en-US': 'Only support English, numbers and special characters on the keyboard'
            }
          }
        ]
      }
    ]
  }
};
