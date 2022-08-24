import { useForm } from './useForm';
import { useDebounce } from './useDebounce';
import { useThrottle } from './useThrottle';
import useControllableValue from './useControllableValue';
import useForceUpdate from './useForceUpdate';
import PaginationConfig from './PaginationConfigHook';

const HOOKS = { useForm, useDebounce, useThrottle, useControllableValue, useForceUpdate, PaginationConfig };

export default HOOKS;
