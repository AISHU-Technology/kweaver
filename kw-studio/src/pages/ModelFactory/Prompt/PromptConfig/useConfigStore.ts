import { createContext, useContext } from 'react';
import _ from 'lodash';
import { Updater, GetStateAction } from '@/hooks/useImmerState';
import { PromptEditorRef } from '@/components/PromptEditor';

import { TVariables, TEnhanceConfig, TModelParams, TPromptInfo } from './types';

type PublicState = {
  hasPrompt: boolean; // 提示词是否存在, 为了减少更新, 提示词不是实时更新, 只更新`空`和`非空`状态
  resetFlag: number; // 触发重置的标志
  isEditing: boolean; // 查看时默认不可编辑
};

export type StoreProps = {
  action: 'edit' | 'check';
  publicState: PublicState; // 一些全局状态标识
  editorRef?: { current: PromptEditorRef }; // 提示词编辑器实例, 缓存ref的引用更稳妥
  promptInfo: TPromptInfo; // 提示词信息
  originInfo: TPromptInfo; // 原始的提示词信息, 用于重置恢复
  variables: TVariables; // 变量
  enhanceConfig: TEnhanceConfig; // 聊天增强配置
  modelOptions: TModelParams; // 模型的参数配置
  modelData: any; // 当前使用的模型的详细数据
  modelList: any[]; // 模型列表
};
type ContextProps = {
  configStore: StoreProps;
  setConfigStore: Updater<StoreProps>;
  getLatestStore: GetStateAction<StoreProps>;
};
export const initState: StoreProps = {
  action: 'edit',
  publicState: { hasPrompt: true, resetFlag: 0, isEditing: true },
  promptInfo: {} as TPromptInfo,
  originInfo: {} as TPromptInfo,
  variables: [],
  enhanceConfig: { prologue: '' },
  modelOptions: {} as TModelParams,
  modelData: {},
  modelList: []
};
const context = createContext({
  configStore: _.cloneDeep(initState),
  setConfigStore: () => {},
  getLatestStore: () => _.cloneDeep(initState)
} as ContextProps);
export const PromptContextProvider = context.Provider;
export default function useConfigStore() {
  return useContext(context);
}
