/**
 * 通过intl获取当前语言, 较之redux更方便
 */
import { useState } from 'react';
import intl from 'react-intl-universal';

type Language = 'zh-CN' | 'en-US';
export const useLanguage = () => {
  const [language] = useState(() => intl.getInitOptions().currentLocale || 'zh-CN');
  return language as Language;
};
