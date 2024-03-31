import HOOKS from '@/hooks';
import { getParam } from '@/utils/handleFunction';

const getBrowserLanguage = () => {
  const keyMap: any = {
    zh: 'zh-CN',
    'zh-cn': 'zh-CN',
    en: 'en-US',
    'en-us': 'en-US',
    'zh-tw': 'zh-TW', // 繁体中文(台湾)
    'zh-hk': 'zh-TW' // 繁体中文(香港)
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
  const browserLanguage = getBrowserLanguage(); // 浏览器语言不等于用户设备系统语言
  return propsLanguage || urlLanguage || ADLanguage || browserLanguage || 'zh-CN';
}
