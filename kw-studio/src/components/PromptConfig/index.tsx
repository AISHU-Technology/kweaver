import React, { memo, useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { Button } from 'antd';
import HOOKS from '@/hooks';
import classNames from 'classnames';
import DragLine from '@/components/DragLine';
import PromptEditor, { PromptEditorRef, getVariablesPosition } from '@/components/PromptEditor';
import Format from '@/components/Format';
import './style.less';
import ExplainTip from '@/components/ExplainTip';

export interface PromptConfigProps {
  type: string;
  className?: string;
  defaultPrompt?: string;
  onChange?: (value: string) => void;
  alreadyExitLargeData?: any;
}

const VARIABLES = [
  { id: '1', var_name: 'subgraph' },
  { id: '2', var_name: 'query' }
];

const PROMPT_HEIGHT: any = {
  openai: 313,
  private_llm: 359,
  adv: 126
};

export const isCorrectPrompt = (value?: string) => {
  if (!value) return false;
  const positions = getVariablesPosition(value, VARIABLES);
  if (!positions.length) return false;
  const positionsMap = _.keyBy(positions, 'match');
  return VARIABLES.every(item => positionsMap[item.var_name]);
};

// 渲染提示词解释
export const PromptTip = memo(() => {
  const tip = intl.get('cognitiveSearch.promptTip');
  const elements: any[] = [];
  let lastIndex = 0;
  tip.replace(/{{.*?}}/g, (matchText: any, matchIndex: any) => {
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

const MIN_HEIGHT = 126;

const PromptConfig = (props: PromptConfigProps) => {
  const { className, defaultPrompt, onChange, type, alreadyExitLargeData } = props;
  const editorRef = useRef<PromptEditorRef>(null);
  const [scaleHeight, setScaleHeight] = useState(214);
  const maxHeight = useRef(0); // 最大高度
  const screenHeightRef = useRef<any>(null); // 屏幕上一次的高度
  const { height: screenHeight } = HOOKS.useWindowSize();

  useEffect(() => {
    defaultPrompt && editorRef.current?.init(defaultPrompt, { variables: VARIABLES });
  }, [defaultPrompt]);

  useEffect(() => {
    if (screenHeightRef?.current !== screenHeight) {
      screenHeightRef.current = screenHeight;
      onJudgeMaxHeight(alreadyExitLargeData, true);
    } else {
      onJudgeMaxHeight(alreadyExitLargeData, false);
    }
  }, [alreadyExitLargeData, screenHeight]);

  /**
   * 根据大模型个数设置可拉伸最大高度
   */
  const onJudgeMaxHeight = (data: any, isChange: boolean) => {
    if (data?.length === 2) {
      maxHeight.current = screenHeight - 575;
    } else if (data?.length === 1) {
      const subType = data?.[0]?.sub_type;
      if (subType === 'openai') {
        maxHeight.current = 464;
      } else {
        maxHeight.current = 504;
      }
    } else {
      maxHeight.current = 608;
    }
    if (isChange) {
      const newHeight = scaleHeight > maxHeight.current ? maxHeight.current : scaleHeight;
      setScaleHeight(newHeight);
    }
  };

  /**
   * 使用模板, 插入内容而不是全部替换
   */
  const insertTemplate = () => {
    const originValue = editorRef.current?.codemirrorRef.current?.getValue();
    const wrap = !originValue?.trim() || originValue?.endsWith('\n') ? '' : '\n';
    const value = originValue + wrap + intl.get('cognitiveSearch.promptTemplate');
    editorRef.current?.init(value, { variables: VARIABLES });
    editorRef.current?.codemirrorRef?.current?.scrollTo(+Infinity, +Infinity);
  };

  /**
   * 高度变化
   */
  const onHeightChange = (y: any) => {
    const height =
      y + scaleHeight < MIN_HEIGHT
        ? MIN_HEIGHT
        : y + scaleHeight > maxHeight?.current
        ? maxHeight?.current
        : y + scaleHeight;
    setScaleHeight(height);
  };

  return (
    <div className={classNames('qa-prompt-editor-wrap', className)}>
      <div className="editor-toolbar kw-space-between kw-mb-2">
        <div className="kw-required kw-flex title-box">
          <div className="kw-c-text">{intl.get('cognitiveSearch.promptTitle')}</div>
          <ExplainTip title={<PromptTip />} />
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
        variables={VARIABLES}
        height={type !== 'adv' ? PROMPT_HEIGHT[type] : scaleHeight}
        placeholder={intl.get('cognitiveSearch.useTempTip')}
        onValueChange={onChange}
        options={{ autoRefresh: true }}
      />
      {type === 'adv' ? <DragLine className="dragLine" onChange={(x: any, y: any) => onHeightChange(y)} /> : null}
    </div>
  );
};

export default PromptConfig;
