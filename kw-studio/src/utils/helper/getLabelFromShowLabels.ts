import _ from 'lodash';

import stringEllipsis from './stringEllipsis';

const getLabelFromShowLabels = (labels?: any[], limit?: number) => {
  if (!labels) return '';
  const checkedLabel = _.filter(labels, l => l?.isChecked);
  return _.map(checkedLabel, l => stringEllipsis(l.value, limit || 15))?.join('\n');
};

export default getLabelFromShowLabels;
