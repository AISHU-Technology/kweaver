import { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import HELPER from '@/utils/helper';

export type UsePermissionProps = {
  [key: string]: {
    roleType?: string;
    userType?: string;
    userTypeDepend?: any[];
  };
};
export type Options = {
  disabled?: boolean;
};

const updateStatus = (props: UsePermissionProps, options?: Options) => {
  const { disabled } = options || {};
  return _.entries(props).reduce((res, [key, value]) => {
    const hasPermission = HELPER.getAuthorByUserInfo(value);
    res[key] = disabled ? !hasPermission : hasPermission;
    return res;
  }, {} as Record<string, boolean>);
};

/**
 * 判断权限的hook
 * @param props 接受一个对象, key值是权限别名, value是权限规则
 * @param options 各种配置项, 开启disabled则返回的布尔值表示是否禁用
 * @returns Record<string, boolean>, 表示是否有权限
 */
export const usePermission = (props: UsePermissionProps, options?: Options) => {
  const [permissionStatus, setPermissionStatus] = useState(() => {
    return updateStatus(props, options);
  });
  const selfProps = useRef<UsePermissionProps>(props);
  selfProps.current = props;
  useEffect(() => {
    const storageListener = (e: StorageEvent) => {
      if (e.key !== 'roleCodes') return;
      setPermissionStatus(updateStatus(selfProps.current, options));
    };
    window.addEventListener('storage', storageListener);
    return () => window.removeEventListener('storage', storageListener);
  }, []);
  return permissionStatus;
};
