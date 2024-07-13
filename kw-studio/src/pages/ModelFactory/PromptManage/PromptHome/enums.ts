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

export const SORTER_MENU = [
  { key: 'create_time', label: intl.get('llmModel.byCreate') },
  { key: 'update_time', label: intl.get('llmModel.byUpdate') },
  { key: 'prompt_name', label: intl.get('llmModel.byName') }
];

export const PROMPT_TYPE_OPTION = [
  { key: 'all', value: 'all', label: intl.get('global.all') },
  { key: 'chat', value: 'chat', label: intl.get('prompt.chat') },
  { key: 'completion', value: 'completion', label: intl.get('prompt.completion') }
];

export const FILTER_STATUS_OPTIONS = [
  { key: 'all', value: 'all', label: intl.get('global.all') },
  { key: 'yes', value: 'yes', label: intl.get('modelService.published') },
  { key: 'no', value: 'no', label: intl.get('modelService.unpublished') }
];

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

export const getPromptTypeText = (type: string) => {
  const data = _.keyBy(PROMPT_TYPES, 'key');
  return data[type]?.label || type;
};

export const getOperateMenu = (isDeployed: boolean) => {
  return [
    { key: 'check', label: intl.get('global.check') },
    { key: 'edit', label: intl.get('global.edit') },
    { key: 'move', label: intl.get('prompt.moveTo') },
    { key: 'delete', label: intl.get('global.delete') }
  ];
};
