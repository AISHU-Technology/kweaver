import { useCallback, useEffect, useMemo, useRef } from 'react';
import { sessionStore } from '@/utils/handleFunction';
import { useLocation } from 'react-router-dom';

type UseRouteCacheFunc = <S = {}>(initialState?: S) => [S, (param: S) => void];

const ROUTE_CACHE_KEY = 'routeCache';

/**
 * 路由缓存
 * 场景：A跳转B , A 缓存一些状态，以便 B返回A页面时，A页面能保持状态
 * A 跳 B ，然后 B跳 C，然后 C跳 A的场景，A跳B页面缓存的数据会被清除
 * 总结： A 跳 B 缓存的状态， 只会在 B 回 A 的时候 生效
 * @param initialCache
 */
const useRouteCache: UseRouteCacheFunc = initialCache => {
  const location = useLocation<{ from?: string }>();
  const cacheRef = useRef(initialCache ?? {});

  const cacheKey = useMemo(() => `${location.pathname}_${ROUTE_CACHE_KEY}`, []);

  const routeCache = useMemo(() => {
    const cacheData = sessionStore.get(cacheKey);
    if (cacheData) {
      const currentRoute = `${location.pathname}${location.search}`;
      const fromRoute = location.state?.from;
      if (currentRoute === cacheData.source && fromRoute === cacheData.target) {
        return cacheData;
      }
    }
    return {};
  }, []);

  useEffect(() => {
    sessionStore.remove(cacheKey);
    return () => {
      if (Object.keys(cacheRef.current).length > 0) {
        const source = `${location.pathname}${location.search}`;
        const target = `${window.location.pathname}${decodeURIComponent(window.location.search)}`;
        sessionStore.set(cacheKey, {
          source,
          target,
          ...cacheRef.current
        });
      }
    };
  }, []);

  const setRouteCache = useCallback((param: any) => {
    cacheRef.current = {
      ...cacheRef.current,
      ...param
    };
  }, []);

  return [routeCache, setRouteCache];
};

export default useRouteCache;
