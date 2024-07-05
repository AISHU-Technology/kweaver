import { useLocation, useHistory } from 'react-router-dom';

type UseAdHistoryFuncResult = {
  push: (url: string, state?: Record<string, any>) => void;
  replace: (url: string, state?: Record<string, any>) => void;
  goBack: () => void;
};

type UseAdHistoryFunc = () => UseAdHistoryFuncResult;

/**
 * 在路由跳转的基础上，记录是从哪个页面跳转至目标页面的
 *  场景： A 跳转 B， B页面要能够知道是从A跳过来的
 *  同时， B 再返回 A，A 页面也要能知道是从B跳转过来的
 */
const useAdHistory: UseAdHistoryFunc = () => {
  const history = useHistory();
  const location = useLocation<any>();
  const currentUrl = `${location.pathname}${location.search}`;
  const push = (url: string, state: Record<string, any> = {}) => {
    const routePath = location.state?.routePath ?? [];
    routePath.push(currentUrl);
    history.push(url, {
      ...state,
      from: currentUrl,
      routePath
    });
  };

  const replace = (url: string, state: Record<string, any> = {}) => {
    const routePath = location.state?.routePath ?? [];
    routePath.push(url);
    history.replace(url, {
      ...state,
      from: currentUrl,
      routePath
    });
  };

  const goBack = () => {
    const routePath = location.state?.routePath ?? [];
    if (routePath.length > 0) {
      const backTargetUrl = routePath.pop();
      history.replace(backTargetUrl, {
        ...location.state,
        from: currentUrl,
        routePath
      });
    } else {
      history.goBack();
    }
  };

  return {
    push,
    replace,
    goBack
  };
};

export default useAdHistory;
