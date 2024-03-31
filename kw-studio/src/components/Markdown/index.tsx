import MarkdownIt from 'markdown-it';
import mdKatex from '@traptitech/markdown-it-katex';
import mdLink from 'markdown-it-link-attributes';
import highlightJS from 'highlight.js';
import './highlight.less';

import React, { useEffect, useRef, useState, memo } from 'react';
import classNames from 'classnames';

export interface MarkdownProps {
  className?: string;
  content?: string;
}

const Markdown = (props: MarkdownProps) => {
  const { className, content = '' } = props;
  const markdownRef = useRef<any>();
  const [mdContent, setMdContent] = useState('');

  useEffect(() => {
    markdownRef.current = new MarkdownIt({
      html: true,
      linkify: true,
      highlight(code: any, language: any) {
        const validLang = !!(language && highlightJS.getLanguage(language));
        if (validLang) {
          const lang = language ?? '';
          return highlightJS.highlight(code, { language: lang }).value;
        }
        return highlightJS.highlightAuto(code).value;
      }
    });

    markdownRef.current.use(mdLink, { attrs: { target: '_blank', rel: 'noopener' } });
    markdownRef.current.use(mdKatex, { blockClass: 'katex-block', errorColor: ' #cc0000', output: 'mathml' });
  }, []);

  useEffect(() => {
    setMdContent(markdownRef.current?.render?.(content) || '');
  }, [content]);

  return <div className={classNames(className, 'highlightRoot')} dangerouslySetInnerHTML={{ __html: mdContent }}></div>;
};

export default memo(Markdown);
