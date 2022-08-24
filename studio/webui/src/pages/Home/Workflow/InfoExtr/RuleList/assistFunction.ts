import _ from 'lodash';
import intl from 'react-intl-universal';
import { uniqueRuleId } from '../assistFunction';

const isRuleRepeat = (rules: any[]) => {
  return _.uniqBy(rules, item => item.entity_type + item.property.property_field).length < rules.length;
};

enum ErrorType {
  EMPTY,
  LEN,
  FORMAT,
  REPEAT
}
const ERR_MSG = {
  [ErrorType.EMPTY]: 'workflow.information.inputEmpty',
  [ErrorType.LEN]: 'workflow.information.max64',
  [ErrorType.FORMAT]: 'workflow.information.nameConsists',
  [ErrorType.REPEAT]: 'workflow.information.nameRepeat'
};
const reg = /^[\u4e00-\u9fa5A-Za-z0-9_]+$/;
const VERIFY_FUNCS = [
  (value: string) => (!value.length ? { type: ErrorType.EMPTY } : false),
  (value: string) => (value.length > 64 ? { type: ErrorType.LEN } : false),
  (value: string) => (!reg.test(value) ? { type: ErrorType.FORMAT } : false)
];

export { isRuleRepeat };
