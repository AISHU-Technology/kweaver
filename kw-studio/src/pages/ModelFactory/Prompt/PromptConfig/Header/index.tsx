import React, { useMemo, useState } from 'react';
import { Button, message } from 'antd';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { useHistory, Prompt as RouterPrompt } from 'react-router-dom';

import _ from 'lodash';

import * as promptServices from '@/services/prompt';
import IconFont from '@/components/IconFont';
import TipModal from '@/components/TipModal';

import ModelIcon from '@/pages/ModelFactory/LLMModel/components/ModelIcon';
import { getRememberParams } from '../../PromptHome/utils';
import PromptOperateModal from '../../PromptHome/components/PromptOperateModal';
import ModelParameterConfig from '../components/ModelParameterConfig';

import { isVariableErr, getCorrectModelOptions } from '../utils';
import { verifyVariables } from '../components/VariableTable/nameValidator';
import './style.less';

import useConfigStore from '../useConfigStore';
import AdExitBar from '@/components/AdExitBar/AdExitBar';

export interface HeaderProps {
  className?: string;
  onReset?: () => void;
}

const Header = (props: HeaderProps) => {
  const { className, onReset } = props;
  const history = useHistory();
  const {
    configStore: {
      publicState,
      promptInfo,
      originInfo,
      modelData,
      modelList,
      modelOptions,
      editorRef,
      variables,
      enhanceConfig
    },
    setConfigStore
  } = useConfigStore();
  const [editVisible, setEditVisible] = useState(false);
  const [isPrevent, setIsPrevent] = useState(true);
  const [exitVisible, setExitVisible] = useState(false);
  const isChanged = useMemo(() => {
    if (!_.isEqual(promptInfo, originInfo)) return true;
    if (modelData.model_id !== originInfo.model_id) return true;
    if (!_.isEqual(modelOptions, originInfo.model_para)) return true;
    if (enhanceConfig.prologue !== originInfo.opening_remarks) return true;
    const vars = _.map(variables, v => _.omit(v, 'id', 'error', 'input'));
    if (!_.isEqual(vars, originInfo.variables)) return true;
    return false;
  }, [originInfo, promptInfo, modelData, modelOptions, enhanceConfig, variables]);

  const onBack = () => {
    const search = getRememberParams(promptInfo as any);
    history.push(`/model-factory/prompt-home${search}`);
  };

  const onAfterEdit = (data: any) => {
    message.success(intl.get('global.saveSuccess'));
    setEditVisible(false);
    const newInfo = { ...promptInfo, ..._.omit(data, 'prompt_id') };
    setConfigStore(pre => {
      pre.promptInfo = newInfo;
      pre.originInfo = _.cloneDeep(newInfo);
    });
    if (data.model_id !== promptInfo.model_id) {
      const modelData = _.find(modelList, d => d.model_id === data.model_id) || {};
      const newParams = getCorrectModelOptions(modelOptions, modelData.model_para);
      setConfigStore(pre => {
        pre.modelData = modelData;
        pre.modelOptions = newParams;
      });
    }
  };

  const onEdit = () => {
    setConfigStore(pre => {
      pre.publicState = { ...pre.publicState, isEditing: !pre.publicState.isEditing };
    });
  };

  /**
   * 保存
   * @param hideMessage 是否隐藏消息提示
   */
  const onSave = async (hideMessage = false) => {
    const verifiedVar = verifyVariables(variables);
    if (isVariableErr(verifiedVar)) {
      setConfigStore(pre => ({ ...pre, variables: verifiedVar }));
      message.error('变量配置有误，请修改');
      return false;
    }
    const body: any = {
      prompt_id: promptInfo.prompt_id,
      model_id: modelData.model_id,
      model_para: modelOptions,
      messages: editorRef?.current?.getValue?.() || '',
      variables: _.map(variables, v => _.omit(v, 'id', 'input', 'error')),
      opening_remarks: enhanceConfig.prologue
    };
    try {
      const { res } = (await promptServices.promptEdit(body)) || {};
      res && !hideMessage && message.success(intl.get('global.saveSuccess'));
      // 可能换了分类, 更新记住的url
      if (res) {
        const search = getRememberParams(body);
        const url =
          window.origin + window.location.pathname + `${search}&action=edit&prompt_id=${promptInfo.prompt_id}`;
        window.history.replaceState({}, '', url);
      }
      const newInfo = { ...promptInfo, ...body };
      setConfigStore(pre => {
        pre.promptInfo = newInfo;
        pre.originInfo = _.cloneDeep(newInfo);
      });
      return true;
    } catch (err) {
      const { description } = err?.response || err?.data || err || {};
      description && message.error(description);
    }
    return false;
  };

  const onPublish = async () => {
    const isSuccess = await onSave();
    if (!isSuccess || promptInfo.prompt_deploy) return;
    try {
      const { res } = (await promptServices.promptDeploy({ prompt_id: promptInfo.prompt_id })) || {};
    } catch (err) {
      //
    }
  };

  const saveAndExit = async () => {
    await onSave();
    setExitVisible(false);
    setIsPrevent(false);
    await Promise.resolve();
    onBack();
  };

  const unSaveAndExit = async () => {
    setIsPrevent(false);
    setExitVisible(false);
    await Promise.resolve();
    onBack();
  };

  return (
    <div className={classNames(className, 'mf-prompt-config-header')}>
      <AdExitBar
        onExit={onBack}
        extraContent={
          <div className="kw-space-between">
            <div className="kw-align-center">
              <div className="t-name kw-ellipsis" title={promptInfo.prompt_name}>
                {promptInfo.prompt_name}
              </div>
              {publicState.isEditing && (
                <IconFont type="icon-edit" className="kw-ml-2 kw-pointer" onClick={() => setEditVisible(true)} />
              )}
            </div>
            <div className="right-extra kw-align-center">
              {!publicState.isEditing ? (
                <>
                  <ModelIcon size={16} type={modelData.model_series} />
                  <span className="kw-pl-2 kw-pr-2">{modelData.model_name}</span>
                </>
              ) : (
                <ModelParameterConfig>
                  <div className="model-btn kw-align-center kw-c-header kw-pointer">
                    <ModelIcon size={16} type={modelData.model_series} />
                    <span className="kw-pl-2 kw-pr-2">{modelData.model_name}</span>
                    <IconFont type="icon-setting" />
                  </div>
                </ModelParameterConfig>
              )}
              {/* 后续会做此功能 (暂时保留) */}
              {/* <Button className="kw-ml-3" onClick={() => setCodeVisible(true)}>
          查看代码
        </Button> */}
              {!publicState.isEditing ? (
                <Button className="kw-ml-3" type="primary" onClick={onEdit}>
                  {intl.get('global.edit')}
                </Button>
              ) : (
                <>
                  <Button className="kw-ml-3" onClick={onReset}>
                    {intl.get('prompt.reset')}
                  </Button>
                  {/* 暂时保留 */}
                  {/* <Button className="kw-ml-3" onClick={() => onSave()}>
              {intl.get('global.save')}
            </Button> */}
                  <Button className="kw-ml-3" type="primary" onClick={onPublish}>
                    {intl.get('global.save')}
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      />

      <PromptOperateModal
        visible={editVisible}
        data={promptInfo}
        action="edit"
        onCancel={() => setEditVisible(false)}
        onOk={onAfterEdit}
      />
      {/* 查看代码弹窗 (暂时保留) */}
      {/* <CodeModal visible={codeVisible} onCancel={() => setCodeVisible(false)} /> */}

      <TipModal
        visible={exitVisible}
        title={intl.get('prompt.exitTitle')}
        content={intl.get('prompt.exitContent')}
        okText={intl.get('prompt.saveClose')}
        cancelText={intl.get('prompt.abandon')}
        keyboard={false}
        closable
        onOk={saveAndExit}
        onCancel={unSaveAndExit}
        onClose={() => setExitVisible(false)}
      />

      <RouterPrompt
        when={isPrevent && isChanged}
        message={location => {
          if (location.pathname === '/login') return true;
          setExitVisible(true);
          return false;
        }}
      />
    </div>
  );
};

export default Header;
