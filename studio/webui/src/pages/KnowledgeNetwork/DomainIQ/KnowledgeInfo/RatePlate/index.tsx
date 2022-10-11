import React, { memo } from 'react';
import intl from 'react-intl-universal';
import ExplainTip from '@/components/ExplainTip';
import { sourceToAngle } from './assistFunction';
import './style.less';

const x1 = 50 - 45.39;
const y1 = 50 + 12.16;
const x2 = 50 - 41.88;
const y2 = 50 - 21.34;
const x3 = 50 - 16.84;
const y3 = 50 - 43.88;
const x4 = 50 + 16.84;
const y4 = 50 - 43.88;
const x5 = 50 + 41.88;
const y5 = 50 - 21.34;
const x6 = 50 + 45.39;
const y6 = 50 + 12.16;
const deg = Math.PI / 180;
const x7 = 50 - 40 * Math.cos(15 * deg);
const y7 = 50 + 40 * Math.sin(15 * deg);
const x8 = 50;
const y8 = 50 - 40;
const x9 = 50 + 40 * Math.cos(15 * deg);
const y9 = 50 + 40 * Math.sin(15 * deg);

const RatePlate = (props: { source?: number }) => {
  const { source } = props;
  const { angle, x, y } = sourceToAngle(source);

  return (
    <div className="iq-rate-plate">
      <svg viewBox="0 0 100 65">
        {/* 环 */}
        <path d={`M ${x1},${y1} A 47,47 0 0 1 ${x2},${y2}`} stroke="#FAAD14" strokeWidth="4" fill="none" />
        <path d={`M ${x2},${y2} A 47,47 0 0 1 ${x3},${y3}`} stroke="#00BDD4" strokeWidth="4" fill="none" />
        <path d={`M ${x3},${y3} A 47,47 0 0 1 ${x4},${y4}`} stroke="#126EE3" strokeWidth="4" fill="none" />
        <path d={`M ${x4},${y4} A 47,47 0 0 1 ${x5},${y5}`} stroke="#7CBE00" strokeWidth="4" fill="none" />
        <path d={`M ${x5},${y5} A 47,47 0 0 1 ${x6},${y6}`} stroke="#019688" strokeWidth="4" fill="none" />

        {/* 刻度 */}
        <path
          d={`M ${x7},${y7} A 40,40 0 0 1 ${x8},${y8}`}
          stroke="#f0f0f0"
          strokeWidth="4"
          fill="none"
          strokeDasharray="0.6 5.2"
        />
        <path
          d={`M ${x7},${y7} A 40,40 0 0 1 ${x8},${y8}`}
          stroke="#d9d9d9"
          strokeWidth="6"
          fill="none"
          strokeDasharray="1 28"
        />
        <path
          d={`M ${x9},${y9} A 40,40 0 0 0 ${x8},${y8}`}
          stroke="#f0f0f0"
          strokeWidth="4"
          fill="none"
          strokeDasharray="0.6 5.2"
        />
        <path
          d={`M ${x9},${y9} A 40,40 0 0 0 ${x8},${y8}`}
          stroke="#d9d9d9"
          strokeWidth="6"
          fill="none"
          strokeDasharray="1 28"
        />

        {/* 指针 */}
        <polygon points="0,0 0,6 6,3" fill="#126ee3" transform={`translate(${x}, ${y}) rotate(${angle}, 6, 3)`} />
      </svg>

      <div className="source-format">
        <p className="s-text">{typeof source === 'undefined' || source < 0 ? '--' : source}</p>
        <p className="ad-mt-1 tip-text">
          {intl.get('global.domainIQ')}
          <ExplainTip.DOMAIN_IQ />
        </p>
      </div>
    </div>
  );
};

export default memo(RatePlate);
