import React, { useEffect, useMemo } from 'react';
import { ConfigProvider, message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import * as promptServices from '@/services/prompt';
import HOOKS from '@/hooks';
import { uniquePromptId } from '@/components/PromptEditor';
import { tipModalFunc } from '@/components/TipModal';
import { getParam } from '@/utils/handleFunction';

import Header from './Header';
import Configs from './Configs';
import PreviewAndTry from './PreviewAndTry';
import { TModelParams } from './types';
import { getCorrectModelOptions, getDefaultModelOptions } from './utils';
import './style.less';

import { PromptContextProvider, StoreProps, initState } from './useConfigStore';

export interface PromptConfigProps {
  className?: string;
}

const getAction = () => {
  const action = getParam('action');
  return ['edit', 'check'].includes(action) ? action : 'edit';
};

const PromptConfig = (props: any) => {
  const { className } = props;
  const [configStore, setConfigStore, getLatestStore] = HOOKS.useImmerState<StoreProps>(() => ({
    ...initState,
    action: getAction()
  }));
  const contextValue = useMemo(() => ({ configStore, setConfigStore, getLatestStore }), [configStore]);

  useEffect(() => {
    init();
  }, []);

  /**
   * 编辑或查看进入
   */
  const init = async () => {
    setConfigStore(pre => {
      pre.publicState = { ...pre.publicState, isEditing: getAction() !== 'check' };
    });
    const prompt_id = getParam('prompt_id');
    if (!prompt_id) return;
    try {
      const { res } = await promptServices.promptDetail({ prompt_id });
      if (!res) return;
      const { messages, model_id, model_para, opening_remarks } = res;
      const variables = _.map(res.variables, v => ({ ...v, id: uniquePromptId() }));
      setConfigStore(pre => {
        pre.originInfo = _.cloneDeep(res);
        pre.promptInfo = _.cloneDeep(res);
        pre.modelOptions = model_para;
        pre.variables = variables;
        pre.enhanceConfig = { prologue: opening_remarks };
      });
      const { editorRef } = getLatestStore();
      editorRef?.current?.init?.(messages, { variables });
      getModelList(model_id, model_para);
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
  };

  /**
   * 获取模型
   * @param model_id 初始化的模型id
   * @param isCreate 是否是新建进入
   */
  const getModelList = async (model_id: string, oldData?: TModelParams) => {
    const { res } = (await promptServices.promptLLMList()) || {};
    if (!res?.data) return;
    const modelList = res.data;
    const modelData = _.find(modelList, d => d.model_id === model_id) || {};
    setConfigStore(pre => {
      pre.modelList = modelList;
      if (!modelData) return;
      pre.modelData = modelData;
      if (oldData) {
        pre.modelOptions = getCorrectModelOptions(oldData, modelData.model_para);
      } else {
        pre.modelOptions = getDefaultModelOptions(modelData.model_para);
      }
    });
  };

  /**
   * 重置，仅重置编辑器、变量、开场白、模型参数、预览区域
   */
  const onReset = async () => {
    const isOk = await tipModalFunc({
      title: intl.get('prompt.resetTip').split('\n')[0],
      content: intl.get('prompt.resetTip').split('\n')[1]
    });
    if (!isOk) return;
    const { originInfo, modelList, publicState } = configStore;
    const { messages, model_id, model_para, opening_remarks = '' } = originInfo;
    const variables = _.map(originInfo.variables, v => ({ ...v, id: uniquePromptId() }));
    const modelData = _.find(modelList, d => d.model_id === model_id) || {};
    setConfigStore(pre => {
      pre.modelOptions = model_para || getDefaultModelOptions(modelData?.model_para);
      pre.variables = variables;
      pre.enhanceConfig = { prologue: opening_remarks };
      pre.publicState = { ...publicState, resetFlag: publicState.resetFlag + 1 };
      pre.modelData = modelData;
    });
    const { editorRef } = getLatestStore();
    editorRef?.current?.init?.(messages, { variables });
  };

  return (
    <div className={classNames(className, 'mf-prompt-config-root kw-h-100')}>
      <ConfigProvider autoInsertSpaceInButton={false}>
        <PromptContextProvider value={contextValue}>
          <Header onReset={onReset} />
          <div className="prompt-config-main kw-flex">
            <div className="main-left">
              <Configs />
            </div>
            <div className="main-right kw-flex-item-full-width">
              <PreviewAndTry />
            </div>
          </div>
        </PromptContextProvider>
      </ConfigProvider>
    </div>
  );
};

export default PromptConfig;
