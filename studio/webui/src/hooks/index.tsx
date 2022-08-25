import useControllableValue from './useControllableValue';
import { useDebounce } from './useDebounce';
import useForceUpdate from './useForceUpdate';
import { useForm } from './useForm';
import { useThrottle } from './useThrottle';
import PaginationConfig from './PaginationConfigHook';
import useInterval from './useInterval';

const HOOKS = {
  useForm,
  useDebounce,
  useThrottle,
  useControllableValue,
  useForceUpdate,
  PaginationConfig,
  useInterval
};

export default HOOKS;
