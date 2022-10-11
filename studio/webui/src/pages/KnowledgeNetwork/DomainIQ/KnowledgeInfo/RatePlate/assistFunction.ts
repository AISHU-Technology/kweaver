const sin = Math.sin;
const cos = Math.cos;
const abs = Math.abs;
const deg = Math.PI / 180;

/**
 * 智商评分转化为进度条百分比
 * 中下（迟钝）：0 ~ 89
 * 中等：90 ~ 109
 * 中上（聪明）：110 ~ 119
 * 优秀：120 ~ 129
 * 超优：> 130
 * @param source 领域智商评分
 */
const sourceToAngle = (source?: number) => {
  let angle = 0;
  let x = -9999;
  let y = -9999;
  const R = 50;
  const r = 35;
  const xOffset = 6;
  const yOffset = 3;

  if (typeof source === 'undefined' || source < 0) return { angle, x, y };

  switch (true) {
    case source < 90:
      angle = (source / 90) * 42 - 15 - 180;
      x = R + r * cos(abs(deg * angle));
      y = R - r * sin(abs(deg * angle));
      break;
    case source < 110:
      angle = ((source - 90) / (110 - 90) + 1) * 42 - 15 - 180;
      x = R + r * cos(abs(deg * angle));
      y = R - r * sin(abs(deg * angle));
      break;
    case source < 120:
      angle = ((source - 110) / (120 - 110) + 2) * 42 - 15 - 180;
      x = R + r * cos(abs(deg * angle));
      y = R - r * sin(abs(deg * angle));
      break;
    case source <= 130:
      angle = ((source - 120) / (130 - 120) + 3) * 42 - 15 - 180;
      x = R + r * cos(abs(deg * angle));
      y = R - r * sin(abs(deg * angle));
      break;
    default:
      angle = 15;
      x = R + r * cos(abs(deg * angle));
      y = R + r * sin(abs(deg * angle));
  }
  return { angle, x: x - xOffset, y: y - yOffset };
};

export { sourceToAngle };
