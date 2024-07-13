import CodeMirror, { EditorFromTextArea } from 'codemirror';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/keymap/sublime';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/meta';
import 'codemirror/theme/monokai.css';

import intl from 'react-intl-universal';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { message } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { uniqueParamId, isDeleteParam, swapPos, formatToEditor, decodeEditorText } from './util';
import { ParamItem, Pos, FormatRule } from './type';
import './style.less';

export interface ParamEditorRef {
  initMark: (
    statements: string | string[],
    params?: ParamItem[],
    options?: { format?: FormatRule; before?: (data: any) => void }
  ) => void;
  addMark: (attributes: Record<string, any>, format?: FormatRule) => Record<string, any> | undefined;
  removeMark: (data: ParamItem) => void;
  removeMark2: (data: ParamItem) => void;
  updateMark: (data: ParamItem, format?: FormatRule) => void;
  getOriginData: () => Record<string, any>;
  markAble: () => boolean;
  getSelectText: () => string;
  getValue: () => string;
  clearSelection: () => void;
  insertText: (text: string) => void;
  removeText: () => void;
  editorInstance: EditorFromTextArea;
}

export interface ParamEditorProps {
  className?: string;
  value?: string;
  params?: any[];
  options?: Record<string, any>;
  width?: string;
  height?: string;
  disabled?: boolean;
  readonly?: boolean;
  onShiftEnter?: () => void;
  onChange?: (value: string, params?: any[], removeArr?: any) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onSelectionChange?: (isSelection: boolean, text: string) => void;
}

const ParamCodeEditor: React.ForwardRefRenderFunction<ParamEditorRef, ParamEditorProps> = (props, ref) => {
  const { className, value, disabled, readonly, options: customOption = {} } = props;
  const selfProps = useRef<ParamEditorProps>(props);
  selfProps.current = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>();
  const mousedownFlag = useRef(false);

  useImperativeHandle(ref, () => ({
    initMark,
    addMark,
    removeMark,
    updateMark,
    getOriginData,
    markAble,
    getSelectText,
    getValue: () => editorRef.current?.getValue(),
    clearSelection,
    insertText,
    removeText,
    removeMark2,
    editorInstance: editorRef.current as EditorFromTextArea
  }));

  useEffect(() => {
    if (editorRef.current) return;
    renderCodeMirror();

    const mouseupListener = () => {
      if (!mousedownFlag.current || !editorRef.current || selfProps.current.disabled) return;
      const isSelected = editorRef.current.somethingSelected();
      const text = editorRef.current.getSelections()[0];
      selfProps.current.onSelectionChange?.(isSelected, text);
      mousedownFlag.current = false;
    };
    window.addEventListener('mouseup', mouseupListener);

    return () => {
      window.removeEventListener('mouseup', mouseupListener);
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (value !== editorRef.current.getValue()) {
      editorRef.current.setValue(value || '');
    }
  }, [value]);

  useEffect(() => {
    editorRef.current.setOption('readOnly', disabled || readonly ? 'nocursor' : disabled);
  }, [disabled, readonly]);

  /**
   * 初始化编辑器
   */
  const renderCodeMirror = () => {
    const options = {
      mode: 'text/x-sql',
      tabSize: 2,
      fontSize: '14px',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      lineWrapping: true,
      lineNumbers: true,
      fullScreen: true,
      ...customOption
    };
    editorRef.current = CodeMirror.fromTextArea(textareaRef.current!, options);

    editorRef.current.on('change', codemirrorValueChange);
    editorRef.current.on('keydown', keydown);
    editorRef.current.on('focus', focus);
    editorRef.current.on('blur', blur);
    editorRef.current.on('mousedown', () => (mousedownFlag.current = true));
    editorRef.current.on('keyHandled', keyHandled);
    const { value, width = '100%', height } = props;
    editorRef.current.setValue(value || '');
    if (width || height) {
      editorRef.current.setSize(width, height);
    }
  };

  useEffect(() => {
    const { width = '100%', height } = props;
    editorRef.current.setSize(width, height);
  }, [props?.height]);

  /**
   * 内容变化回调
   */
  const codemirrorValueChange = (
    doc: { getValue: () => string },
    change: { origin: string; removed: string[]; from: Pos; to: Pos; text: string[] }
  ) => {
    const newValue = doc.getValue();
    const { origin, removed, text } = change;
    const removeInfo = {
      ch: change?.from?.ch,
      line: change?.from?.line,
      removeName: removed[0]
    };

    if (origin === 'setValue') return;

    if (origin && [...removed, ...text].some(str => isDeleteParam(str))) {
      const existedParams = _.reduce(
        editorRef.current.getAllMarks(),
        (res, mark) => {
          if (mark.attributes?._type === 'param') {
            const param = mark.attributes;
            res[param._id] = { ...param, example: param._text };
          }
          return res;
        },
        {} as any
      );
      return selfProps.current.onChange?.(newValue, _.values(existedParams), removeInfo);
    }

    selfProps.current.onChange?.(newValue);
  };

  /**
   * 聚焦回调
   * @param arg
   */
  const focus = (instance: { doc: { getValue: () => string } }) => {
    selfProps.current.onFocus?.(instance.doc.getValue());
  };

  /**
   * 失焦回调
   */
  const blur = (instance: { doc: { getValue: () => string } }) => {
    selfProps.current.onBlur?.(instance.doc.getValue());
  };

  /**
   * 阻止回车默认行为
   */
  const keydown = (_: any, e: { shiftKey: boolean; keyCode: number; preventDefault: () => void }) => {
    if (e.shiftKey === true && e.keyCode === 13) {
      selfProps.current.onShiftEnter?.();
      e.preventDefault();
    }
  };

  /**
   * 处理ctrl + A
   * @param name 按键值
   */
  const keyHandled = (_: any, name: string) => {
    if (name !== 'Ctrl-A') return;
    const isSelected = editorRef.current.somethingSelected();
    const text = editorRef.current.getSelections()[0];
    selfProps.current.onSelectionChange?.(isSelected, text);
    mousedownFlag.current = false;
  };

  /**
   * 添加标记样式
   * @param start 起点
   * @param end 终点
   * @param attr 额外的属性
   */
  const addMarkStyle = (start: Pos, end: Pos, attr?: Record<string, any>) => {
    editorRef.current.markText(start, end, {
      className: 'kw-param-highlight',
      atomic: true,
      attributes: { _type: 'param', _id: attr?._id || uniqueParamId(), ...(attr || {}) }
    });
  };

  /**
   * 添加编辑器的 `参数标记` 样式
   * @param attributes 添加属性, 若不指定id, 则自动生成id, 添加成功会return新的属性
   * @param format 替换内容的规则
   */
  const addMark = (attributes: Record<string, any>, format?: FormatRule) => {
    if (!editorRef.current.somethingSelected()) return;
    const selectText = editorRef.current.getSelections()[0];
    const replaceText = format ? format(attributes) : `\${${attributes?.name || selectText}}`;
    const selection = editorRef.current.listSelections()[0];
    const [start, end] = swapPos(_.pick(selection.anchor, 'line', 'ch'), _.pick(selection.head, 'line', 'ch'));

    if (!markAble()) return;

    editorRef.current.replaceRange(replaceText, start, end);
    end.ch = start.ch + replaceText.length;

    const attr = _.merge(
      { _id: attributes?._id || uniqueParamId(), _text: attributes?._text || selectText },
      attributes
    );
    addMarkStyle(start, end, attr);
    return attr;
  };

  /**
   * 移除编辑器的 `参数标记` 样式
   */
  const removeMark = (data: ParamItem) => {
    const marks = _.filter(editorRef.current.getAllMarks(), item => item.attributes?._id === data._id);
    _.forEach(marks, mark => {
      const { attributes } = mark;
      const { from, to } = mark.find();
      const [start, end] = swapPos(from, to);
      editorRef.current.replaceRange(attributes._text, start, end);
    });
  };
  const removeMark2 = (data: ParamItem) => {
    const marks = _.filter(editorRef.current.getAllMarks(), item => item.attributes?.name === data.name);
    _.forEach(marks, mark => {
      const { attributes } = mark;
      const { from, to } = mark.find();
      const [start, end] = swapPos(from, to);
      editorRef.current.replaceRange(attributes._text, start, end);
    });
  };

  /**
   * 更新编辑器的 `参数标记` 样式
   * @param data 参数对象
   * @param format 替换内容的规则
   */
  const updateMark = (data: ParamItem, format?: FormatRule) => {
    const newText = format ? format(data) : `\${${data.name}}`;
    const marks = _.filter(editorRef.current.getAllMarks(), item => item.attributes?._id === data._id);
    _.forEach(marks, mark => {
      const { attributes } = mark;
      const { from, to } = mark.find();
      const [start, end] = swapPos(from, to);
      editorRef.current.replaceRange(newText, start, end);
      end.ch = start.ch + newText.length;
      addMarkStyle(start, end, { ...data, _text: attributes._text });
    });
  };

  /**
   * 初始化参数样式
   * @param statements 函数代码语句
   * @param params 参数列表
   * @param options 其他配置, format: 格式化函数, before: 初始化前
   */
  const initMark = (
    statements: string | string[],
    params?: ParamItem[],
    options?: { format?: FormatRule; before?: (data: any) => void }
  ) => {
    const { format, before } = options || {};
    const statementsArr = Array.isArray(statements) ? statements : _.split(statements, '\n');
    const paramArr = params || [];
    const [newStatement, newParams] = formatToEditor(statementsArr, paramArr, format);
    const value = newStatement.join('\n');
    before?.({ value, params: newParams });
    editorRef.current.setValue(value);
    selfProps.current.onChange?.(value);
    _.forEach(newParams, p => {
      addMarkStyle(p.from, p.to, { _id: p._id, _text: p._text, ...p });
    });
  };

  /**
   * 获取序列化的数据
   * @return `value`: 编辑器当前显示内容
   * @return `values`: 按照每一行, 返回编辑器当前显示内容的数组
   * @return `statements`: 原始代码语句数组
   * @return `statement`: 原始代码语句, \n 分割行数
   * @return `params`: 参数数组
   */
  const getOriginData = () => {
    const [statements, params] = decodeEditorText(editorRef.current);
    const value = editorRef.current.getValue();
    return {
      value,
      values: value.split('\n'),
      statements,
      statement: statements.join('\n').trim(),
      params
    };
  };

  /**
   * 选中的文字是否可参数化
   */
  const markAble = () => {
    const selectionText = getSelectText();
    const selection = editorRef.current.listSelections()[0];
    const [start, end] = swapPos(_.pick(selection.anchor, 'line', 'ch'), _.pick(selection.head, 'line', 'ch'));
    if (start.line !== end.line) {
      message.error(intl.get('function.enjambment'));
      return false;
    }

    const existMarkList = editorRef.current.findMarks(start, end);
    if (existMarkList.length) {
      message.error(intl.get('function.hasParamed'));
      return false;
    }

    if (_.includes(selectionText, ';')) {
      message.error(intl.get('function.lineTip'));
      return false;
    }

    return true;
  };

  /**
   * 获取选中文字
   */
  const getSelectText = () => {
    if (!editorRef.current.somethingSelected()) return '';
    return editorRef.current.getSelections()[0];
  };

  /**
   * 清除选中
   */
  const clearSelection = () => {
    editorRef.current.setSelection({ line: 0, ch: 0 }, { line: 0, ch: 0 }, { scroll: false });
    selfProps.current.onSelectionChange?.(false, '');
    mousedownFlag.current = false;
  };

  /**
   * 向编辑器插入文本
   * @param text
   */
  const insertText = (text: string) => {
    if (editorRef.current.somethingSelected()) {
      const selection = editorRef.current.listSelections()[0];
      const [start, end] = swapPos(_.pick(selection.anchor, 'line', 'ch'), _.pick(selection.head, 'line', 'ch'));
      editorRef.current.replaceRange(text, start, end, '+insert');
      return;
    }
    const start = _.pick(editorRef.current.getCursor(), 'line', 'ch');
    editorRef.current.replaceRange(text, start, start, '+insert');
  };

  /**
   * 清空编辑器文本
   * @param text
   */
  const removeText = () => {
    editorRef.current.setValue('');
  };

  return (
    <div className={classNames('c-param-editor', { 'c-param-editor-disabled': disabled || readonly }, className)}>
      <textarea ref={textareaRef} />
    </div>
  );
};

export default forwardRef(ParamCodeEditor);
export * from './util';
