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
    <div className="iq-rate-plate kw-column-center">
      <img style={{ width: 184, height: 74 }} src={require('@/assets/images/DomainIQ.svg').default} alt="" />

      <div className="score-format">
        <div className="s-text">{formatIQNumber(score)}</div>
        <div className="kw-mt-1 tip-text">
          {intl.get('global.domainIQ')}
          <ExplainTip type="DOMAIN_IQ" />
        </div>
      </div>
    </div>
  );
};

export default memo(ScorePanel);
