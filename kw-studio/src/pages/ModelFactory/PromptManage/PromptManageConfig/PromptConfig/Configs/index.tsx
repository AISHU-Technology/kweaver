import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import _ from 'lodash';

import { PromptEditorRef, getVariablesPosition } from '@/components/PromptEditor';

import PromptTextarea from '../components/PromptTextarea';
import VariableTable from '../components/VariableTable';

import { verifyVariables } from '../components/VariableTable/nameValidator';
import { TTemplates, TVariables } from '../../types';
import './style.less';

import useConfigStore from '../useConfigStore';

export interface ConfigsProps {
  className?: string;
}

const Configs = (props: any) => {
  const { className, isError, setIsError, setIsChange, formData } = props;
  const editorRef = useRef<PromptEditorRef>();
  const isChangeRef = useRef<any>(false);
  const { configStore, setConfigStore } = useConfigStore();
  const { action, publicState, promptInfo, variables, enhanceConfig } = configStore;

  useEffect(() => {
    setConfigStore(pre => {
      pre.editorRef = editorRef as any;
    });
  }, []);

  /**
   * 提示词输入框变化
   */
  const onValueChange = (value: string) => {
    if (isChangeRef?.current) {
      setIsChange(true);
    }

    if (value?.replace(/\s*/g, '')) {
      setIsError(false);
    } else {
      setIsError(true);
    }
    setConfigStore(pre => {
      pre.promptInfo = { ...promptInfo, messages: value };
    });
    // const hasPrompt = !!value && value.length < 5000;
    // hasPrompt !== publicState.hasPrompt &&
    //   setConfigStore(pre => {
    //     pre.publicState = { ...publicState, hasPrompt };
    //   });
  };

  /**
   * 添加变量
   */
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

  /**
   * 变量变化
   */
  const onVariableChange = (data: TVariables, changedKey: keyof TVariables[number], changedIndex: number) => {
    setIsChange(true);
    setConfigStore(pre => ({ ...pre, variables: data }));
    changedKey === 'var_name' && editorRef.current?.updateVariable(data[changedIndex]); // 改名需要更新编辑器
  };

  /**
   * 删除变量
   */
  const onVariableDelete = (data: TVariables[number], index: number) => {
    setIsChange(true);
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
   * 导入模板
   */
  const onUseTemplate = (temp: TTemplates[number]) => {
    // const { prompt_name, prompt_desc, opening_remarks } = temp;
    // setConfigStore(pre => {
    //   pre.promptInfo = { ...promptInfo, prompt_name, prompt_desc };
    //   pre.enhanceConfig = { prologue: opening_remarks };
    // });
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
   * 获取焦点
   */
  const onFocus = (value: string) => {
    isChangeRef.current = true;
  };

  /**
   * 保存开场白
   */
  const onSavePrologue = (prologue: string) => {
    setConfigStore(pre => ({ ...pre, enhanceConfig: { ...pre.enhanceConfig, prologue } }));
  };

  return (
    <div className={classNames(className, 'manage-mf-prompt-config-box kw-h-100 kw-w-100')}>
      <PromptTextarea
        editorRef={editorRef}
        onBlur={onBlur}
        onFocus={onFocus}
        isError={isError}
        className="kw-mb-6"
        formData={formData}
        variables={variables}
        setIsChange={setIsChange}
        onUseTemplate={onUseTemplate}
        onValueChange={onValueChange}
        promptType={promptInfo.prompt_type}
        onVariableChange={onVariableChangeByEditor}
        disabled={action === 'check' && !publicState.isEditing}
      />
      <VariableTable
        variables={variables}
        onAdd={onAddVariable}
        onChange={onVariableChange}
        onDelete={onVariableDelete}
        disabled={action === 'check' && !publicState.isEditing}
      />
    </div>
  );
};

export default Configs;
