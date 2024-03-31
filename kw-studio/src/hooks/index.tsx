import { useForm } from './useForm';
import { useDebounce } from './useDebounce';
import { useThrottle } from './useThrottle';
import useControllableValue from './useControllableValue';
import useForceUpdate from './useForceUpdate';
import PaginationConfig from './PaginationConfigHook';
import { useWindowSize } from './useWindowSize';
import useInterval from './useInterval';
import { useUpdateEffect } from './useUpdateEffect';
import { useLanguage } from './useLanguage';
import useSize from './useSize';
import useDeepCompareEffect from './useDeepCompareEffect';
import useLatestState from './useLatestState';
import useSafeState from './useSafeState';
import useImmerState from './useImmerState';
import { usePermission } from './usePermission';
import useAdHistory from './useAdHistory';
import useRouteCache from './useRouteCache/index';

const HOOKS = {
  useForm,
  useDebounce,
  useThrottle,
  useControllableValue,
  useForceUpdate,
  PaginationConfig,
  useWindowSize,
  useInterval,
  useUpdateEffect,
  useLanguage,
  useSize,
  useDeepCompareEffect,
  useLatestState,
  useSafeState,
  useImmerState,
  usePermission,
  useAdHistory,
  useRouteCache
};

export default HOOKS;
