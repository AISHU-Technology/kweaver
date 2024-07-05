import intl from 'react-intl-universal';
import _ from 'lodash';
import { FormValidator } from '@/utils/handleFunction';
import { TVariables } from '../../../types';

const validator = new FormValidator();

const getRules = () => {
  return {
    var_name: [
      { required: true, message: intl.get('global.noNull') },
      {
        max: 50,
        message: intl.get('global.lenErr', { len: 50 })
      },
      {
        pattern: /^[a-zA-Z0-9!-~]+$/,
        message: intl.get('dpapiService.onlyKeyboard')
      }
    ],
    field_name: [
      { required: true, message: intl.get('global.noNull') },
      {
        max: 50,
        message: intl.get('global.lenErr', { len: 50 })
      }
    ]
  };
};

/**
 * 校验单个
 */
export const triggerVerify = (item: any, allData: any[]) => {
  const rulesObj = getRules();
  const error: Record<string, string> = {};
  _.entries(rulesObj).forEach(([field, rules]) => {
    if (_.has(item, field)) {
      let errMsg = validator.verify(item[field], { rules });
      if (!errMsg) {
        if (_.find(allData, d => d.id !== item.id && d[field] === item[field])) {
          errMsg = intl.get('global.repeatName');
        }
      }
      if (!errMsg) return;
      error[field] = errMsg;
    }
  });
  return error;
};

/**
 * 校验全部
 */
export const verifyVariables = (variables: TVariables) => {
  const verifiedData = _.map(variables, (item, index) => {
    const error = triggerVerify(item, variables);
    return { ...item, error };
  });
  return verifiedData;
};
