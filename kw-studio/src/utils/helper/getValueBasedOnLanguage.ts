import { kwCookie } from '@/utils/handleFunction';

const getValueBasedOnLanguage = (data: { [key: string]: any }, lang?: string) => {
  const language: any = lang || kwCookie.get('kwLang') || 'zh-CN';
  return data[language];
};

export default getValueBasedOnLanguage;
