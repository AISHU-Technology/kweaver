import React, { memo } from 'react';
import intl from 'react-intl-universal';
import ExplainTip from '@/components/ExplainTip';
import { formatIQNumber } from '@/utils/handleFunction';
import { scoreToAngle, RANGE_POINTS, SCALE_POINTS } from './assistFunction';
import './style.less';

const ScorePanel = (props: { score?: number }) => {
  const { score } = props;
  const { angle, x, y } = scoreToAngle(score);
  return (
    <div className="iq-rate-plate">
      <svg viewBox="0 0 100 65">
        {/* 环 */}
        {RANGE_POINTS.map((point, index) => {
          if (index === RANGE_POINTS.length - 1) return;
          const { x: x0, y: y0, color } = point;
          const { x: x1, y: y1 } = RANGE_POINTS[index + 1];
          return (
            <path
              key={color}
              d={`M ${x0},${y0} A 47,47 0 0 1 ${x1},${y1}`}
              stroke={color}
              strokeWidth="4"
              fill="none"
            />
          );
        })}

        {/* 刻度 */}
        <path
          d={`M ${SCALE_POINTS[0].x},${SCALE_POINTS[0].y} A 40,40 0 0 1 ${SCALE_POINTS[1].x},${SCALE_POINTS[1].y}`}
          stroke="#f0f0f0"
          strokeWidth="4"
          fill="none"
          strokeDasharray="0.6 5.2"
        />
        <path
          d={`M ${SCALE_POINTS[0].x},${SCALE_POINTS[0].y} A 40,40 0 0 1 ${SCALE_POINTS[1].x},${SCALE_POINTS[1].y}`}
          stroke="#d9d9d9"
          strokeWidth="5"
          fill="none"
          strokeDasharray="1 28"
        />
        <path
          d={`M ${SCALE_POINTS[2].x},${SCALE_POINTS[2].y} A 40,40 0 0 0 ${SCALE_POINTS[1].x},${SCALE_POINTS[1].y}`}
          stroke="#f0f0f0"
          strokeWidth="4"
          fill="none"
          strokeDasharray="0.6 5.2"
        />
        <path
          d={`M ${SCALE_POINTS[2].x},${SCALE_POINTS[2].y} A 40,40 0 0 0 ${SCALE_POINTS[1].x},${SCALE_POINTS[1].y}`}
          stroke="#d9d9d9"
          strokeWidth="5"
          fill="none"
          strokeDasharray="1 28"
        />

        {/* 指针 */}
        <polygon points="0,0 0,6 6,3" fill="#126ee3" transform={`translate(${x}, ${y}) rotate(${angle}, 6, 3)`} />
      </svg>

      <div className="score-format">
        <p className="s-text">{formatIQNumber(score)}</p>
        <p className="ad-mt-1 tip-text">
          {intl.get('global.domainIQ')}
          <ExplainTip.DOMAIN_IQ />
        </p>
      </div>
    </div>
  );
};

export default memo(ScorePanel);
