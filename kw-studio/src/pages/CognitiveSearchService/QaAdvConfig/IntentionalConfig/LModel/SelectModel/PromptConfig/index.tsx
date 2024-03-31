import React, { memo, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button, message } from 'antd';
import classNames from 'classnames';
import PromptEditor, { PromptEditorRef, getVariablesPosition } from '@/components/PromptEditor';
import Format from '@/components/Format';
import './style.less';
import ExplainTip from '@/components/ExplainTip';

export interface PromptConfigProps {
  title: string;
  tip: string;
  promptTemplate: string;
  variables: any[];
  value?: string;
  className?: string;
  defaultPrompt?: string;
  onChange?: (value: string) => void;
  onCheckModelType?: () => void;
}

// 渲染提示词解释
export const PromptTip = memo((props: { tip: string }) => {
  const { tip } = props;
  const elements: any[] = [];
  let lastIndex = 0;
  tip?.replace(/{{.*?}}/g, (matchText, matchIndex) => {
    elements.push(tip.slice(lastIndex, matchIndex));
    elements.push(
      <span key={matchIndex} className="kw-c-warning">
        {matchText}
      </span>
    );
    lastIndex = matchIndex + matchText.length;
    return matchText;
  });
  if (lastIndex < tip.length) elements.push(tip.slice(lastIndex));
  return <>{elements}</>;
});

const PromptConfig = (props: PromptConfigProps) => {
  const { title, tip, promptTemplate, value, variables, className, defaultPrompt, onChange, onCheckModelType } = props;
  const editorRef = useRef<PromptEditorRef>(null);

  useEffect(() => {
    defaultPrompt && editorRef.current?.init(defaultPrompt, { variables });
  }, [defaultPrompt, variables]);

  useEffect(() => {
    if (!value) {
      editorRef.current?.init('');
    }
  }, [value]);

  /**
   * 使用模板, 插入内容而不是全部替换
   */
  const insertTemplate = () => {
    if (!promptTemplate) return onCheckModelType?.();
    const originValue = editorRef.current?.codemirrorRef.current?.getValue();
    const wrap = !originValue?.trim() || originValue?.endsWith('\n') ? '' : '\n';
    const value = originValue + wrap + promptTemplate;
    editorRef.current?.init(value, { variables });
    editorRef.current?.codemirrorRef?.current?.scrollTo(+Infinity, +Infinity);
  };

  return (
    <div className={classNames('advConfig-prompt-editor-wrap', className)}>
      <div className="editor-toolbar kw-space-between kw-mb-2">
        <div className="kw-required">
          <Format.Title>{title}</Format.Title>
          <ExplainTip title={<PromptTip tip={tip} />} />
        </div>

        <Button
          type="link"
          style={{ height: 22, minWidth: 0, lineHeight: '20px', padding: 0 }}
          onClick={insertTemplate}
        >
          {intl.get('cognitiveSearch.useTemp')}
        </Button>
      </div>
      <PromptEditor
        ref={editorRef}
        className="qa-prompt-editor"
        variables={variables}
        height={126}
        placeholder={intl.get('cognitiveSearch.useTempTip')}
        onValueChange={onChange}
      />
    </div>
  );
};

export default PromptConfig;
