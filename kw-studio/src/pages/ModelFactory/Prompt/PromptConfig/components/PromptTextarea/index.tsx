import React, { useState, useEffect, useRef } from 'react';
import { Divider, Tooltip, message } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import _ from 'lodash';

import DragLine from '@/components/DragLine';
import IconFont from '@/components/IconFont';
import ExplainTip from '@/components/ExplainTip';
import Format from '@/components/Format';
import { copyToBoard } from '@/utils/handleFunction';
import PromptEditor, { PromptEditorRef, getVariablesPosition, uniquePromptId } from '@/components/PromptEditor';

import PromptTempModal from '../PromptTempModal';
import { createVariables } from '../../utils';
import { TVariables, TTemplates } from '../../types';
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
}

/**
 * prompt编辑区域
 */
const PromptTextarea = (props: PromptTextareaProps) => {
  const { className, variables, disabled, promptType } = props;
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

  /**
   * 复制
   */
  const onCopy = () => {
    copyToBoard(editor.current?.getValue?.() || '');
    message.success(intl.get('global.copySuccess'));
  };

  return (
    <div className={classNames(className, 'mf-prompt-textarea', { disabled })}>
      <div className="textarea-title kw-space-between kw-pl-3 kw-pr-3">
        <div>
          <IconFont type="icon-tishicishurukuang" style={{ color: 'rgba(88, 80, 236, 1)' }} />
          <Format.Title className="kw-ml-2">{intl.get('prompt.prompt')}</Format.Title>
          <ExplainTip title={intl.get('prompt.promptTip')} />
        </div>

        {!disabled && (
          <div className="kw-align-center">
            <Tooltip title={intl.get('prompt.useTemp')}>
              <div className="kw-c-text-lower kw-pointer" onClick={() => setTempVisible(true)}>
                <IconFont type="icon-shiyongmoban" className="kw-mr-1" />
                <span>{intl.get('prompt.temp')}</span>
              </div>
            </Tooltip>
            <Divider type="vertical" className="kw-ml-3 kw-mr-3" style={{ top: 0, borderColor: '#e5e5e5' }} />
            <Tooltip title={intl.get('prompt.asyncVar')}>
              <div className="kw-pointer kw-c-text-lower kw-c-primary" onClick={clickAddVar}>
                <IconFont type="icon-tongbubianliang" className="kw-mr-1" />
                <span>{intl.get('prompt.var')}</span>
              </div>
            </Tooltip>
          </div>
        )}
        {disabled ? (
          <Tooltip title={intl.get('global.copy')}>
            <div className="kw-pointer kw-c-text-lower" onClick={onCopy}>
              <IconFont type="icon-copy" className="kw-mr-1" />
              <span>{intl.get('global.copy')}</span>
            </div>
          </Tooltip>
        ) : null}
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
        />
        <DragLine className="height-drag-line" style={{ top: scalingHeight - 5 }} onChange={onHeightDrag} />
      </div>

      <PromptTempModal
        type={promptType}
        visible={tempVisible}
        onOk={handleImportTemplate}
        onCancel={() => setTempVisible(false)}
      />
    </div>
  );
};

export default PromptTextarea;
