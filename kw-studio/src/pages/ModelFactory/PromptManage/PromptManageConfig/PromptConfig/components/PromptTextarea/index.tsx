import React, { useState, useEffect, useRef } from 'react';
import { Divider, Tooltip, message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import DragLine from '@/components/DragLine';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import Format from '@/components/Format';
import PromptEditor, { PromptEditorRef, getVariablesPosition, uniquePromptId } from '@/components/PromptEditor';

import PromptTempModal from '../PromptTempModal';
import { createVariables } from '../../utils';
import { TVariables, TTemplates } from '../../../types';
import './style.less';

export interface PromptTextareaProps {
  className?: string;
  editorRef?: React.MutableRefObject<PromptEditorRef | undefined>;
  variables: TVariables;
  disabled?: boolean;
  promptType: 'chat' | 'completion' | string;
  onValueChange?: (value: string) => void;
  onVariableChange?: (data: TVariables) => void;
  onUseTemplate?: (data: TTemplates[number]) => void;
  onBlur?: (value: string) => void;
  isError?: boolean;
  setIsChange?: (data: boolean) => void;
  onFocus?: (value: string) => void;
  formData?: any;
}

/**
 * prompt编辑区域
 */
const PromptTextarea = (props: PromptTextareaProps) => {
  const { className, variables, disabled, promptType, isError, setIsChange, onFocus, formData } = props;
  const { onValueChange, onVariableChange, onUseTemplate, onBlur } = props;
  const editor = useRef<PromptEditorRef>(null);
  const [tempVisible, setTempVisible] = useState(false);
  const [scalingHeight, setScalingHeight] = useState(200);
  const setScalingHeightThrottle = _.throttle(h => {
    setScalingHeight(h);
  }, 100);

  useEffect(() => {
    if (_.has(props.editorRef, 'current') && editor.current) {
      props.editorRef!.current = editor.current;
    }
  }, []);

  const onUsedVarChange = () => {
    //
  };

  /**
   * 使用模板
   */
  const handleImportTemplate = (data: TTemplates[number]) => {
    setIsChange?.(true);
    onUseTemplate?.(data);
    setTempVisible(false);
    const variables = _.map(data.variables, v => ({ ...v, id: uniquePromptId() }));
    editor.current?.init(data.messages, { variables });
    onVariableChange?.(variables);
  };

  /**
   * 添加未定义的变量
   */
  const clickAddVar = () => {
    const text = editor.current?.getValue?.() || '';
    const allPositions = getVariablesPosition(text);
    const existedVars = _.map(variables, v => v.var_name);
    const unExistedVarPositions = _.filter(allPositions, pos => !existedVars.includes(pos.match));
    if (!unExistedVarPositions.length) {
      return message.warning(intl.get('prompt.varPlace'));
    }
    const tipVars = createVariables(_.uniq(unExistedVarPositions.map(pos => pos.match)));
    const idMap = _.keyBy(tipVars, 'var_name');
    _.forEach(unExistedVarPositions, pos => {
      pos.id = idMap[pos.match].id;
    });
    editor.current?.addVariables(unExistedVarPositions);
    onVariableChange?.([...variables, ...tipVars]);
  };

  /**
   * 布局拉伸
   * @param yOffset 垂直方向偏移量
   */
  const onHeightDrag = (xOffset: number, yOffset: number) => {
    const y = scalingHeight + yOffset;
    const min = 200;
    const max = window.innerHeight - 300;
    const curHeight = y > max ? max : y < min ? min : y;
    setScalingHeightThrottle(curHeight);
  };

  return (
    <div className={classNames(className, 'manage-mf-prompt-textarea', { disabled })}>
      <div className="textarea-title kw-space-between kw-pl-3 kw-pr-3">
        {!disabled && (
          <div className="kw-align-center">
            <Format.Button
              type="icon-text"
              className="kw-c-text-lower"
              onClick={() => setTempVisible(true)}
              title={intl.get('prompt.useTemp')}
            >
              <IconFont type="icon-shiyongmoban" className="kw-mr-1 kw-ml-0" />
              <span>{intl.get('prompt.temp')}</span>
            </Format.Button>
            <Format.Button
              type="icon-text"
              className="kw-c-text-lower"
              title={intl.get('prompt.asyncVar')}
              onClick={clickAddVar}
            >
              <IconFont type="icon-tongbubianliang1" className="kw-mr-1 kw-ml-0" />
              <span>{intl.get('prompt.var')}</span>
            </Format.Button>
          </div>
        )}
      </div>
      <div style={{ position: 'relative', height: scalingHeight }}>
        <PromptEditor
          ref={editor}
          placeholder={intl.get('prompt.promptPlace')}
          height={scalingHeight}
          atomic={false}
          readOnly={disabled}
          variables={variables}
          onValueChange={onValueChange}
          onUsedVarChange={onUsedVarChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
        <DragLine className="height-drag-line" style={{ top: scalingHeight - 5 }} onChange={onHeightDrag} />
        {isError ? <div className="kw-c-error">{intl.get('global.noNull')}</div> : null}
      </div>

      <PromptTempModal
        type={promptType}
        formData={formData}
        visible={tempVisible}
        onOk={handleImportTemplate}
        onCancel={() => setTempVisible(false)}
      />
    </div>
  );
};

export default PromptTextarea;
