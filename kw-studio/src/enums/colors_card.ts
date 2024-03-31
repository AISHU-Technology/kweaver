import _ from 'lodash';

const COLORS = [
  '#ED473A',
  '#FF7442',
  '#FFA500',
  '#EAC600',
  '#9ACD32',
  '#2FB536',
  '#10936C',
  '#51C6CF',
  '#19BEFF',
  '#1975FF',
  '#2242E3',
  '#8956EE',
  '#B333CC',
  '#CD853F',
  '#A41313',
  '#6B7273',
  '#A5ADAD',
  '#D8D8D8',
  '#000000',
  '#ffffff'
];

const getColor = () => _.cloneDeep(COLORS);

const SUB_GROUP_COLORS = ['#f5222d', '#fa8c16', '#fadb14', '#52c41a', '#13c2c2', '#1677ff', '#722ed1', '#eb2f96'];
const getSubGroupColor = () => _.cloneDeep(COLORS);

const COLORS_CARD = {
  COLORS,
  SUB_GROUP_COLORS,
  getColor,
  getSubGroupColor
};

export default COLORS_CARD;
