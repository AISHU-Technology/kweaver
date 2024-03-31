import intl from 'react-intl-universal';
import _ from 'lodash';
import { sessionStore } from '@/utils/handleFunction';

const viewTypeSessionKey = 'mf-prompt-view-type';

export const PROJECT_STATE = {
  mountLoading: true,
  loading: false,
  page: 1,
  total: 0,
  searchTotal: 0,
  name: ''
};
const PROMPT_STATE = {
  loading: false,
  viewType: 'card',
  page: 1,
  total: 0,
  name: '',
  order: 'descend',
  rule: 'create_time',
  deploy: 'all',
  prompt_type: 'all'
};
export const getPromptReduceState = () => {
  const viewTypeCache = sessionStore.get(viewTypeSessionKey);
  const viewType = ['card', 'list'].includes(viewTypeCache) ? viewTypeCache : 'card';
  return { ...PROMPT_STATE, viewType };
};
export type PromptState = typeof PROMPT_STATE;
export type ProjectState = typeof PROJECT_STATE;
export const promptReducer = (state: PromptState, action: Partial<PromptState>) => {
  if (action.viewType) {
    sessionStore.set(viewTypeSessionKey, action.viewType);
  }
  return { ...state, ...action };
};
export const projectReducer = (state: ProjectState, action: Partial<ProjectState>) => ({ ...state, ...action });

// 排序下拉选项
export const SORTER_MENU = [
  { key: 'create_time', label: intl.get('llmModel.byCreate') },
  { key: 'update_time', label: intl.get('llmModel.byUpdate') },
  { key: 'prompt_name', label: intl.get('llmModel.byName') }
];

// 模型筛选项
export const PROMPT_TYPE_OPTION = [
  { key: 'all', value: 'all', label: intl.get('global.all') },
  { key: 'chat', value: 'chat', label: intl.get('prompt.chat') },
  { key: 'completion', value: 'completion', label: intl.get('prompt.completion') }
];

// 发布状态筛选项
export const FILTER_STATUS_OPTIONS = [
  { key: 'all', value: 'all', label: intl.get('global.all') },
  { key: 'yes', value: 'yes', label: intl.get('modelService.published') },
  { key: 'no', value: 'no', label: intl.get('modelService.unpublished') }
];

// prompt类型
export const PROMPT_TYPES = [
  {
    key: 'completion',
    icon: 'icon-color-wenbenshengchengxing',
    label: intl.get('prompt.completion'),
    desc: intl.get('prompt.completionExplain')
  },
  {
    key: 'chat',
    icon: 'icon-color-duihuaxing',
    label: intl.get('prompt.chat'),
    desc: intl.get('prompt.chatExplain')
  }
];

// 获取prompt类型的显示名称
export const getPromptTypeText = (type: string) => {
  const data = _.keyBy(PROMPT_TYPES, 'key');
  return data[type]?.label || type;
};

// 操作下拉选项
export const getOperateMenu = (isDeployed: boolean) => {
  return [
    { key: 'check', label: intl.get('global.check') },
    { key: 'edit', label: intl.get('global.edit') },
    { key: 'move', label: intl.get('prompt.moveTo') },
    // isDeployed
    //   ? { key: 'undeploy', label: intl.get('global.unPublish') }
    //   : { key: 'deploy', label: intl.get('global.publish') },
    { key: 'delete', label: intl.get('global.delete') }
  ];
};

export const CODE_TEMPLATE = {
  openai: `from llmadapter.llms.llm_factory import llm_factory

api_model='{{model_config.api_model}}'
api_key='your key'
   
llm_factory.create_llm(
    "openai",
    api_type="azure",
    api_version="2023-03-15-preview",
    openai_api_key=api_key,
    engine=api_model,
    temperature={{model_para.temperature}},
    top_p={{model_para.top_p}},
    frequency_penalty = {{model_para.frequency_penalty}},
    presence_penalty= {{model_para.presence_penalty}},
    max_tokens={{model_para.max_tokens}}
)`,
  'aishu-baichuan': `from llmadapter.llms.llm_factory import llm_factory
 
api_type='{{model_config.api_type}}'
api_base='{{model_config.api_base}}'
api_model='{{model_config.api_model}}'
   
llm_factory.create_llm(
    api_type,
    openai_api_base=api_base,
    model=api_model,
    temperature={{model_para.temperature}},
    top_p={{model_para.top_p}},
    frequency_penalty = {{model_para.frequency_penalty}},
    presence_penalty= {{model_para.presence_penalty}},
    max_tokens={{model_para.max_tokens}}
)`
};

