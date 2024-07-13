import _ from 'lodash';

type OptionType = {
  minSize: number;
  maxSize: number;
  defaultSize: number;
};
type CalculateType = {
  source: any;
  sortKey?: string;
  option?: OptionType;
};
const calculateSize = ({ source, sortKey = 'count', option }: CalculateType) => {
  const { minSize = 10, maxSize = 100, defaultSize = 50 } = option || {};
  if (!Array.isArray(source)) return [];
  const array = _.cloneDeep(source);
  array?.sort((a: any, b: any) => {
    if (typeof a === 'object') return a[sortKey] - b[sortKey];
    return a - b;
  });

  const medianIndex = Math.floor(array.length / 2);
  const median = array[medianIndex][sortKey] || 1;

  array[medianIndex].size = defaultSize;
  const ratio = defaultSize / Math.sqrt(median);

  for (let i = medianIndex - 1; i >= 0; --i) {
    const size = Math.sqrt(array[i][sortKey] || 1) * ratio;
    if (size >= minSize) {
      array[i].size = Math.round(Math.sqrt(array[i][sortKey] || 1) * ratio);
    } else {
      array[i].size = minSize;
    }
  }

  for (let i = medianIndex + 1; i < array.length; ++i) {
    const size = Math.sqrt(array[i][sortKey] || 1) * ratio;
    if (size <= maxSize) {
      array[i].size = Math.round(Math.sqrt(array[i][sortKey] || 1) * ratio);
    } else {
      array[i].size = maxSize;
    }
  }

  return array;
};

export default calculateSize;
