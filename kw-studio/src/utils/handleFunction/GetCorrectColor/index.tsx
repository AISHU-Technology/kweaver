const colorList = [
  '#54639c',
  '#5f81d8',
  '#5889c4',
  '#5c539b',
  '#805a9c',
  '#d770a1',
  '#d8707a',
  '#2a908f',
  '#50a06a',
  '#7bbaa0',
  '#91c073',
  '#bbd273',
  '#f0e34f',
  '#ecb763',
  '#e39640',
  '#d9704c',
  '#d9534c',
  '#c64f58',
  '#3a4673',
  '#68798e',
  '#c5c8cc'
];

const hex2Rgba = (bgColor: string, alpha = 1) => {
  const color = bgColor.slice(1);
  const rgba = [
    parseInt('0x' + color.slice(0, 2)),
    parseInt('0x' + color.slice(2, 4)),
    parseInt('0x' + color.slice(4, 6)),
    alpha
  ];
  return 'rgba(' + rgba.toString() + ')';
};

/**
 * 本体被删除时, 知识图谱详情中无法获取颜色
 * 如果没有颜色值, 生成随机颜色
 * @param {String} color 颜色值
 */
const getCorrectColor = (color = '') => {
  if (color) return color;
  const { length } = colorList;
  return hex2Rgba(colorList[Math.floor(Math.random() * (length - 1))]);
};

export default getCorrectColor;
