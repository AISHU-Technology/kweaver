import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

import _ from 'lodash';
import classNames from 'classnames';

import CodeMirror from 'codemirror';
import 'codemirror/mode/meta';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/addon/display/autorefresh';

import HOOKS from '@/hooks';
import { getVariablesPosition, getMarkVar } from './util';

import './style.less';

type TEditor = CodeMirror.Editor;
export type TVariables = { id: string; var_name: string; [key: string]: any }[];
export interface PromptEditorProps {
  className?: string;
  placeholder?: string;
  variables?: TVariables;
  width?: string | number;
  height?: string | number;
  value?: string;
  atomic?: boolean;
  mode?: string;
  theme?: string;
  readOnly?: boolean;
  options?: Record<string, any>;
  onValueChange?: (value: string) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onUsedVarChange?: (ids: string[]) => void;
}
export interface PromptEditorRef {
  codemirrorRef: React.MutableRefObject<CodeMirror.Editor | undefined>;
  getValue?: TEditor['getValue'];
  setValue?: TEditor['setValue'];
  init: (value: string, options?: { variables?: TVariables }) => void;
  addVariables: (positions: any[]) => void;
  updateVariable: (variable: TVariables[number]) => void;
  removeVariables: (variableNames: string[], isExclude?: boolean) => void;
}

/**
 * prompt编辑器
 * @param props
 */
const PromptEditor: React.ForwardRefRenderFunction<PromptEditorRef, PromptEditorProps> = (props, ref) => {
  const {
    className,
    value,
    placeholder,
    atomic = true,
    mode = 'custom',
    theme,
    readOnly,
    width,
    height,
    options: customOptions
  } = props;
  const selfProps = useRef<PromptEditorProps>(props);
  selfProps.current = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<TEditor>();
  const forceUpdate = HOOKS.useForceUpdate();
  const usedIdsCache = useRef<string[]>([]);

  useImperativeHandle(ref, () => ({
    codemirrorRef: editorRef,
    init,
    addVariables,
    updateVariable,
    removeVariables,
    getValue: (seperator?: string) => editorRef.current?.getValue?.(seperator) || '',
    setValue: (content: string) => editorRef.current?.setValue?.(content)
  }));

  useEffect(() => {
    renderCodeMirror();
  }, []);

  useEffect(() => {
    editorRef.current?.setOption('readOnly', readOnly ? 'nocursor' : false);
  }, [readOnly]);

  useEffect(() => {
    editorRef.current?.setValue(value || '');
  }, [value]);

  useEffect(() => {
    mode && setModeLanguage(mode);
  }, [mode]);

  useEffect(() => {
    theme && setTheme(theme);
  }, [theme]);

  useEffect(() => {
    setSize(width, height);
  }, [width, height]);

  const renderCodeMirror = () => {
    if (editorRef.current) return;
    const defaultOptions = {
      mode: 'custom',
      tabSize: 2,
      fontSize: '14px',
      placeholder,
      showCursorWhenSelecting: true,
      lineWrapping: true,
      ...customOptions
    };
    editorRef.current = CodeMirror.fromTextArea(textareaRef.current!, defaultOptions);
    editorRef.current.on('change', onCodeValueChange);
    editorRef.current.on('focus', focus);
    editorRef.current.on('blur', blur);
    editorRef.current.setValue(props.value || '');
    forceUpdate();
  };

  /**
   * 初始化
   * @param value 初始化的文本
   * @param options 配置项
   */
  const init: PromptEditorRef['init'] = (value = '', options) => {
    editorRef.current?.setValue(value);
    const highlightText = options?.variables || selfProps.current.variables || [];
    const positions = getVariablesPosition(value, highlightText);
    addVariables(positions);
    selfProps.current.onUsedVarChange?.([...new Set(_.map(positions, pos => pos.id))]);
  };

  /**
   * 设置语言高亮, 注意在外部调用importThemes提前引入mode
   * @param language
   */
  const setModeLanguage = async (language: string) => {
    const mode = CodeMirror.findModeByName(language);
    editorRef.current?.setOption('mode', mode?.mode || language);
  };

  /**
   * 设置主题, 注意在外部调用importThemes提前引入主题样式
   * @param theme
   */
  const setTheme = async (theme: string) => {
    editorRef.current?.setOption('theme', theme);
  };

  /**
   * 设置宽高
   * @param width
   * @param height
   */
  const setSize = (width: PromptEditorProps['width'], height: PromptEditorProps['height']) => {
    const curWidth = typeof width === 'number' ? `${width}px` : width || '100%';
    const curHeight = typeof height === 'number' ? `${height}px` : height || '300px';
    editorRef.current?.setSize(curWidth, curHeight);
  };

  /**
   * 聚焦回调
   */
  const focus = (instance: TEditor) => {
    selfProps.current.onFocus?.(instance.getValue());
  };

  /**
   * 失焦回调
   */
  const blur = (instance: TEditor) => {
    selfProps.current.onBlur?.(instance.getValue());
  };

  /**
   * 添加变量
   * @param positions 变量数据的位置信息
   */
  const addVariables = (positions: any[]) => {
    positions.forEach(pos => {
      const existedMarks = editorRef.current?.findMarks(pos.from, pos.to);
      if (existedMarks?.length) return;
      editorRef.current?.markText(pos.from, pos.to, {
        className: 'kw-prompt-highlight',
        atomic,
        attributes: { _type: 'prompt', _variable: pos.match, _id: pos.id }
      });
    });
    varChangedCallback();
  };

  /**
   * 编辑器值变化回调
   * @param instance 编辑器实例
   * @param change 变化的信息
   */
  const onCodeValueChange = (instance: TEditor, change: CodeMirror.EditorChange) => {
    if (!change.origin) return;
    const value = instance.getValue();
    selfProps.current.onValueChange?.(value);
    if (change.origin === 'setValue') return;
    const positions = getVariablesPosition(value, selfProps.current.variables || []);
    const allMark = instance.getAllMarks();
    let changed = false;
    const promptMark = _.filter(allMark, mark => {
      if (atomic) return mark?.attributes?._type === 'prompt';

      try {
        if (mark?.attributes?._type === 'prompt') {
          const markText = getMarkVar(mark);
          if (markText !== mark?.attributes?._variable) {
            mark.clear();
            changed = true;
            return false;
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    });

    if (positions.length !== promptMark.length || changed) {
      addVariables(positions);
    }
    varChangedCallback();
  };

  /**
   * 更新变量
   * @param variable
   */
  const updateVariable = (variable: TVariables[number]) => {
    const marks = _.filter(editorRef.current?.getAllMarks(), item => item.attributes?._id === variable.id);
    _.forEach(marks, mark => {
      const { from, to }: any = mark.find();
      const newText = `{{${variable.var_name}}}`;
      editorRef.current?.replaceRange(newText, from, to);
      to.ch = from.ch + newText.length;
      addVariables([
        {
          id: variable.id,
          from,
          to,
          match: variable.var_name,
          value: newText
        }
      ]);
    });
  };

  /**
   * 移除变量标记
   * @param variableNames 移除的变量名称数组
   * @param isExclude 是否反向移除，即：仅保留variableNames，移除其他的变量
   */
  const removeVariables = (variableNames: string[], isExclude = false) => {
    _.forEach(editorRef.current?.getAllMarks(), mark => {
      if (mark.attributes?._type !== 'prompt') return;
      const markVar = getMarkVar(mark);
      const isRemove = isExclude ? !variableNames.includes(markVar) : variableNames.includes(markVar);
      if (!isRemove) return;
      const { from, to }: any = mark.find();
      editorRef.current?.replaceRange('', from, to);
    });
    varChangedCallback();
  };

  /**
   * 变量的增删改查之后, 返回剩余的id
   */
  const varChangedCallback = () => {
    const idMap: Record<string, any> = {};
    _.forEach(editorRef.current?.getAllMarks(), mark => {
      if (mark.attributes?._type !== 'prompt') return;
      idMap[mark.attributes._id] = true;
    });
    const ids = _.keys(idMap);
    if (!_.isEqual(ids, usedIdsCache.current)) {
      selfProps.current?.onUsedVarChange?.(ids);
      usedIdsCache.current = ids;
    }
  };

  return (
    <div className={classNames('c-prompt-editor', className)}>
      <textarea ref={textareaRef} />
    </div>
  );
};

export default forwardRef(PromptEditor);
export * from './util';
