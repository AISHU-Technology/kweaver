import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

import { PromptEditorRef, getVariablesPosition } from '@/components/PromptEditor';

import PromptTextarea from '../components/PromptTextarea';
import VariableTable from '../components/VariableTable';
import ChatEnhance from '../components/ChatEnhance';

import { verifyVariables } from '../components/VariableTable/nameValidator';
import { TTemplates, TVariables } from '../types';
import './style.less';

import useConfigStore from '../useConfigStore';

export interface ConfigsProps {
  className?: string;
}

const Configs = (props: any) => {
  const { className } = props;
  const editorRef = useRef<PromptEditorRef>();
  const { configStore, setConfigStore } = useConfigStore();
  const { action, publicState, promptInfo, variables, enhanceConfig } = configStore;

  useEffect(() => {
    setConfigStore(pre => {
      pre.editorRef = editorRef as any;
    });
  }, []);

  const onAddVariable = (data: TVariables) => {
    const newVars = [...variables, ...data];
    setConfigStore(pre => ({ ...pre, variables: newVars }));
    if (!editorRef.current) return;
    let text = editorRef.current.getValue?.() || '';
    _.forEach(data, d => (text += `{{${d.var_name}}}`));
    const positions = getVariablesPosition(text, newVars);
    editorRef.current.setValue?.(text);
    editorRef.current.addVariables(positions);
  };

  const onVariableChange = (data: TVariables, changedKey: keyof TVariables[number], changedIndex: number) => {
    setConfigStore(pre => ({ ...pre, variables: data }));
    changedKey === 'var_name' && editorRef.current?.updateVariable(data[changedIndex]);
  };

  const onVariableDelete = (data: TVariables[number], index: number) => {
    let newVar = [...variables];
    newVar.splice(index, 1);
    newVar = verifyVariables(newVar);
    setConfigStore(pre => ({ ...pre, variables: newVar }));
    editorRef.current?.removeVariables([data.var_name]);
  };

  /**
   * 编辑器的变量变化，会直接返回最终的变量
   */
  const onVariableChangeByEditor = (data: TVariables) => {
    const variables = verifyVariables(data);
    setConfigStore(pre => ({ ...pre, variables }));
  };

  /**
   * 失焦更新提示词, 否则无法监听到提示词变化，无法拦截路由
   * @param value
   */
  const onBlur = (value: string) => {
    setConfigStore(pre => {
      pre.promptInfo = { ...promptInfo, messages: value };
    });
  };

  /**
   * 保存开场白
   */
  const onSavePrologue = (prologue: string) => {
    setConfigStore(pre => ({ ...pre, enhanceConfig: { ...pre.enhanceConfig, prologue } }));
  };

  return (
    <div className={classNames(className, 'mf-prompt-config-box kw-h-100 kw-w-100 kw-p-6')}>
      <PromptTextarea
        editorRef={editorRef}
        className="kw-mb-6"
        variables={variables}
        disabled={action === 'check' && !publicState.isEditing}
        promptType={promptInfo.prompt_type}
        onVariableChange={onVariableChangeByEditor}
        onBlur={onBlur}
      />
      <VariableTable
        disabled={action === 'check' && !publicState.isEditing}
        variables={variables}
        onAdd={onAddVariable}
        onChange={onVariableChange}
        onDelete={onVariableDelete}
      />
      {promptInfo.prompt_type === 'chat' && (
        <ChatEnhance
          className="kw-mt-6"
          value={enhanceConfig.prologue}
          disabled={action === 'check' && !publicState.isEditing}
          onSave={onSavePrologue}
        />
      )}
    </div>
  );
};

export default Configs;
