import _ from 'lodash';

/**
 * helper
 * Build an array containing id an label
 * @param {Array} keys
 * @param {*} keysLabel
 * @returns [{ value:'value', label:'label' }]
 */
const constructListFromKeysAndLabel = (keys: string[] | number[], keysLabel: any = {}) => {
  if (!Array.isArray(keys)) {
    console.error('Function constructListFromKeysAndLabel \n parameters: keys must be an array');
    return [];
  }
  return _.map(keys, key => ({ value: key, label: keysLabel[key as keyof typeof keysLabel] || '' }));
};

export default constructListFromKeysAndLabel;
