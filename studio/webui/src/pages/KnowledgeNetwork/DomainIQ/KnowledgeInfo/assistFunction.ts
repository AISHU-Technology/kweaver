/**
 * 智商评分转化为进度条百分比
 * 中下（迟钝）：80 ~ 89
 * 中等：90 ~ 109
 * 中上（聪明）：110 ~ 119
 * 优秀：120 ~ 129
 * 超优：> 130
 * @param source 领域智商评分
 */
const sourceToPercent = (source: number) => {
  if (!source || source < 0) return 0;

  switch (true) {
    case source < 80:
      return (source / 80) * 20;
    case source < 90:
      return ((source - 80) / (90 - 80)) * 20 + 20;
    case source < 110:
      return ((source - 90) / (110 - 90)) * 20 + 40;
    case source < 120:
      return ((source - 110) / (120 - 110)) * 20 + 60;
    case source < 130:
      return ((source - 120) / (130 - 120)) * 20 + 80;
    default:
      return 100;
  }
};

export { sourceToPercent };
