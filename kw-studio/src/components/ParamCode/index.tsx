import CodeMirror, { EditorFromTextArea } from 'codemirror';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/display/placeholder.js';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/keymap/sublime';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/meta';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python.js';

import 'codemirror/addon/fold/foldgutter.css'; // 代码折叠
import 'codemirror/addon/fold/foldcode.js'; // 代码折叠
import 'codemirror/addon/fold/foldgutter.js'; // 代码折叠
import 'codemirror/addon/fold/brace-fold.js'; // 代码折叠
import 'codemirror/addon/fold/comment-fold.js';

import intl from 'react-intl-universal';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { message, Input } from 'antd';
import classNames from 'classnames';
import _ from 'lodash';
import { uniqueParamId, isDeleteParam, swapPos, formatToEditor, decodeEditorText } from './util';
import { ParamItem, Pos, FormatRule } from './type';
import './style.less';

export interface ParamEditorRef {
  initMark?: (
    statements: string | string[],
    params?: ParamItem[],
    options?: { format?: FormatRule; before?: (data: any) => void }
  ) => void;
  addMark: (attributes: Record<string, any>, format?: FormatRule) => Record<string, any> | undefined;
  removeMark: (data: ParamItem) => void;
  updateMark: (data: ParamItem, format?: FormatRule) => void;
  getOriginData: () => Record<string, any>;
  markAble: () => boolean;
  getSelectText: () => string;
  getValue: () => string;
  clearSelection: () => void;
  insertText: (text: string) => void;
  editorInstance: EditorFromTextArea; // 实例
}

export interface ParamEditorProps {
  className?: string;
  value?: string;
  params?: any[]; // 参数
  options?: Record<string, any>; // 编辑器配置
  width?: string;
  height?: string;
  disabled?: boolean;
  readonly?: boolean;
  onShiftEnter?: () => void;
  onChange?: (value: string, params?: any[]) => void;
  onFocus?: (value: string) => void;
  onBlur?: (value: string) => void;
  onSelectionChange?: (isSelection: boolean, text: string) => void; // 框选回调
}

const { TextArea } = Input;
const ParamCodeEditor: React.ForwardRefRenderFunction<ParamEditorRef, ParamEditorProps> = (props, ref) => {
  const { className, value, disabled, readonly, options: customOption = {} } = props;
  const selfProps = useRef<ParamEditorProps>(props); // 引用props解决hook闭包问题
  selfProps.current = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>();
  const mousedownFlag = useRef(false); // 鼠标按下标志, 配合判断是否框选

  useImperativeHandle(ref, () => ({
    // initMark,
    addMark,
    removeMark,
    updateMark,
    getOriginData,
    markAble,
    getSelectText,
    getValue: () => editorRef.current?.getValue(),
    clearSelection,
    insertText,
    editorInstance: editorRef.current as EditorFromTextArea
  }));

  useEffect(() => {
    if (editorRef.current) return;
    renderCodeMirror();

    // 鼠标可能在编辑器外部抬起, 所以在window上监听mouseup
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

  // 外部更新值
  // WARNING 你应该只将value用于设置初值, 而不是频繁更新它, 因为这可能导致`参数标记`的样式丢失
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
      tabSize: 2,
      indentUnit: 8, // 换行缩进位数
      lint: true,
      autoCloseBrackets: true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirrorfoldgutter'],
      fontSize: '14px',
      styleActiveLine: true, // 高亮
      lineWrapping: false, // 自动换行
      matchBrackets: true,
      showCursorWhenSelecting: true,
      lineNumbers: true,
      fullScreen: true,
      ...customOption
    };
    editorRef.current = CodeMirror.fromTextArea(textareaRef.current!, options);

    // 事件监听
    editorRef?.current?.on('change', codemirrorValueChange);
    editorRef?.current?.on('keydown', keydown);
    editorRef?.current?.on('focus', focus);
    editorRef?.current?.on('blur', blur);
    editorRef?.current?.on('mousedown', () => (mousedownFlag.current = true));
    editorRef?.current?.on('keyHandled', keyHandled);
    const { value, width = '100%', height } = props;
    editorRef?.current?.setValue(value || '');
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

    if (origin === 'setValue') return;

    // 参数标记被删除或恢复, 返回仍存在的标记
    if (
      // ['+delete', 'redo', 'undo', 'paste', '*compose'].includes(origin) &&
      origin &&
      [...removed, ...text].some(str => isDeleteParam(str))
    ) {
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
      return selfProps.current.onChange?.(newValue, _.values(existedParams));
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
      atomic: true, // 当涉及到光标移动时，原子范围充当单个单元——即不能将光标放在它们内部
      attributes: { _type: 'param', _id: attr?._id || uniqueParamId(), ...(attr || {}) } // 自定义_type字段, 标记它是`参数`
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
    const replaceText = format ? format(attributes) : `\${${attributes?.name || selectText}}`; // 替换的内容
    const selection = editorRef.current.listSelections()[0]; // 选中的坐标信息
    const [start, end] = swapPos(_.pick(selection.anchor, 'line', 'ch'), _.pick(selection.head, 'line', 'ch'));

    if (!markAble()) return;

    // 替换内容
    editorRef.current.replaceRange(replaceText, start, end);
    end.ch = start.ch + replaceText.length; // 重新计算位置

    // 添加样式
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
      // values: value.split('\n'),
      values: value,
      statements,
      // statement: statements.join('\n').trim(),
      statement: statements,
      params
    };
  };

  /**
   * 选中的文字是否可参数化
   */
  const markAble = () => {
    const selectionText = getSelectText();
    const selection = editorRef.current.listSelections()[0]; // 选中的坐标信息
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
    return editorRef.current.getSelections()[0]; // 选中的文字
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
    // 有选中内容, 整个替换
    if (editorRef.current.somethingSelected()) {
      const selection = editorRef.current.listSelections()[0];
      const [start, end] = swapPos(_.pick(selection.anchor, 'line', 'ch'), _.pick(selection.head, 'line', 'ch'));
      editorRef.current.replaceRange(text, start, end, '+insert');
      return;
    }
    // 在光标处插入
    editorRef.current.replaceSelection(text);
    const value = editorRef.current?.doc?.getValue();
    editorRef?.current?.setValue(JSON.stringify(value, null, 8));
  };

  return (
    <div className={classNames('c-param-editor', { 'c-param-editor-disabled': disabled || readonly }, className)}>
      <textarea ref={textareaRef} />
    </div>
  );
};

export default forwardRef(ParamCodeEditor);
export * from './util';
