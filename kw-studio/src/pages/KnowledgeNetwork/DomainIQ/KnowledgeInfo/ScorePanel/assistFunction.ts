const sin = Math.sin;
const cos = Math.cos;
const abs = Math.abs;
const deg = Math.PI / 180;
const rangeDeg = 42; // 每个环区间的角度大小
const starDeg = 15 + 180; // 起点角度

// 计算绘制环的点, 6个点绘制5段环
const COLORS = ['#FAAD14', '#00BDD4', '#126EE3', '#7CBE00', '#019688'];
const RANGE_POINTS = Array.from({ length: 6 }, (_, index) => {
  const x = 50 + 47 * cos((starDeg - rangeDeg * index) * deg);
  const y = 50 - 47 * sin((starDeg - rangeDeg * index) * deg);
  const color = COLORS[index];
  return { x, y, color };
});

// 绘制刻度的点, 三个点绘制两段闭合的环路径, 设置虚线模拟刻度
const SCALE_POINTS = [
  {
    x: 50 - 40 * cos(15 * deg),
    y: 50 + 40 * sin(15 * deg)
  },
  {
    x: 50,
    y: 50 - 40
  },
  {
    x: 50 + 40 * cos(15 * deg),
    y: 50 + 40 * sin(15 * deg)
  }
];

/**
 * 智商评分转化为刻度
 * 中下（迟钝）：0 ~ 89
 * 中等：90 ~ 109
 * 中上（聪明）：110 ~ 119
 * 优秀：120 ~ 129
 * 超优：> 130
 * @param score 领域智商评分
 * @return { Object } angle: 指针旋转角度; (x, y)坐标
 */
const scoreToAngle = (score?: number) => {
  let angle = 0;
  let x = -9999;
  let y = -9999;
  const R = 50;
  const r = 35;

  // 指针自身中心偏移量
  const xOffset = 6;
  const yOffset = 3;

  if (typeof score === 'undefined' || score < 0) return { angle, x, y };

  switch (true) {
    case score < 90:
      angle = (score / 90) * rangeDeg - starDeg;
      break;
    case score < 110:
      angle = ((score - 90) / (110 - 90) + 1) * rangeDeg - starDeg;
      break;
    case score < 120:
      angle = ((score - 110) / (120 - 110) + 2) * rangeDeg - starDeg;
      break;
    case score <= 130:
      angle = ((score - 120) / (130 - 120) + 3) * rangeDeg - starDeg;
      break;
    default:
      angle = 15;
      x = R + r * cos(abs(deg * angle));
      y = R + r * sin(abs(deg * angle));
      return { angle, x: x - xOffset, y: y - yOffset };
  }

  x = R + r * cos(abs(deg * angle));
  y = R - r * sin(abs(deg * angle));
  return { angle, x: x - xOffset, y: y - yOffset };
};

export { scoreToAngle, RANGE_POINTS, SCALE_POINTS };
