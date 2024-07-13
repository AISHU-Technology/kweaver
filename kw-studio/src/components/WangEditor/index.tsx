/**
 * WangEditor富文本编辑器封装
 */

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { Toolbar, Editor } from '@wangeditor/editor-for-react';
import { i18nChangeLanguage } from '@wangeditor/editor';
import type { IDomEditor } from '@wangeditor/editor';
import '@wangeditor/editor/dist/css/style.css';
import classNames from 'classnames';
import { defaultToolbarConfig, defaultEditorConfig } from './defaultConfig';
import './style.less';

export interface WangEditorProps {
  className?: string;
  placeholder?: string;
  height?: string | number;
  value?: string;
  language?: string;
  onChange?: (value: string) => void;
}

export interface WangEditorRef {
  editor: IDomEditor | null;
}

const WangEditor: React.ForwardRefRenderFunction<WangEditorRef, WangEditorProps> = (props, ref) => {
  const { className, placeholder, height, value, language, onChange } = props;
  const [editor, setEditor] = useState<IDomEditor | null>(null);

  useImperativeHandle(ref, () => ({ editor }));

  useEffect(() => {
    i18nChangeLanguage(language === 'en-US' ? 'en' : 'zh-CN');
  }, [language]);

  useEffect(() => {
    return () => {
      if (editor === null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const handleChange = (editor: IDomEditor) => {
    const html = editor.getHtml();
    onChange?.(html);
  };

  return (
    <div className={classNames('kw-c-wang-editor-wrap kw-rich-text-wrap', className)}>
      <Toolbar className="kw-c-wang-editor-tool" editor={editor} defaultConfig={defaultToolbarConfig} />
      <Editor
        className="kw-c-wang-editor"
        defaultConfig={{ ...defaultEditorConfig, placeholder }}
        value={value}
        onCreated={setEditor}
        onChange={handleChange}
        mode="simple"
        style={{ height }}
      />
    </div>
  );
};

export default forwardRef(WangEditor);
