import HOOKS from '@/hooks';
import { getParam } from '@/utils/handleFunction';

const getBrowserLanguage = () => {
  const keyMap: any = {
    zh: 'zh-CN',
    'zh-cn': 'zh-CN',
    en: 'en-US',
    'en-us': 'en-US',
    'zh-tw': 'zh-TW',
    'zh-hk': 'zh-TW'
  };
  return keyMap[window.navigator.language.toLocaleLowerCase()];
};

/**
 * 获取显示语言
 * 优先级: props > url > KWeaver > 浏览器
 * @param props 组件的props
 */
export default function useCardLanguage(props: any) {
  const { language: propsLanguage } = props;
  const urlLanguage = getParam('language');
  const ADLanguage = HOOKS.useLanguage();
  const browserLanguage = getBrowserLanguage();
  return propsLanguage || urlLanguage || ADLanguage || browserLanguage || 'zh-CN';
}
