const getPositionBaseTwoPoint = (start: any, end: any, distanceStart: number) => {
  if (Number(start.x.toFixed(6)) - Number(end.x.toFixed(6)) === 0) {
    const resultX = start.x;
    const resultY = start.y < end.y ? start.y + distanceStart : start.y - distanceStart;
    return { x: resultX, y: resultY };
  }
  if (Number(start.y.toFixed(6)) - Number(end.y.toFixed(6)) === 0) {
    const resultX = start.x < end.x ? start.x + distanceStart : start.x - distanceStart;
    const resultY = start.y;
    return { x: resultX, y: resultY };
  }
  const curPoint = start; // 当前坐标
  const nextPoint = end; // 下个点坐标
  const k = ((curPoint.y - nextPoint.y) * 1.0) / (curPoint.x - nextPoint.x); // 坐标直线斜率k
  const b = curPoint.y - k * curPoint.x; // 坐标直线b
  const A = Math.pow(k, 2) + 1; // A=k^2+1;
  const B = 2 * ((b - curPoint.y) * k - curPoint.x); // B=2[(b-y0)k-x0];
  const m = 1;
  const L = m * distanceStart;
  const C = Math.pow(b - curPoint.y, 2) + Math.pow(curPoint.x, 2) - Math.pow(L, 2);
  const x1 = (-B + Math.sqrt(Math.pow(B, 2) - 4 * A * C)) / (2 * A);
  const x2 = (-B - Math.sqrt(Math.pow(B, 2) - 4 * A * C)) / (2 * A);
  let x = 0; // 最后确定是在已知两点之间的某点
  if (x1 === x2) {
    x = x1;
  } else if ((curPoint.x <= x1 && x1 <= nextPoint.x) || (nextPoint.x <= x1 && x1 <= curPoint.x)) {
    x = x1;
  } else if ((curPoint.x <= x2 && x2 <= nextPoint.x) || (nextPoint.x <= x2 && x2 <= curPoint.x)) {
    x = x2;
  }
  const y = k * x + b;
  return { x, y };
};

export default getPositionBaseTwoPoint;
