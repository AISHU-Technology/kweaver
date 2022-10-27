import React, { memo, useState } from 'react';
import { DownOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import Format from '@/components/Format';
import { formatIQNumber } from '@/utils/handleFunction';
import './style.less';

type Color = { r: number; g: number; b: number };
interface ScoreCardProps {
  className?: string;
  title: React.ReactNode;
  icon: React.ReactNode;
  color: Color;
  score?: number;
  children?: React.ReactNode;
}

const formatColor = ({ r, g, b }: Color, alpha = 1) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

const ScoreCard = ({ className, title, icon, color, score, children }: ScoreCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={classNames('statistics-score-card', className)} style={{ background: formatColor(color, 0.04) }}>
      <div className="ad-align-center card-header">
        <div className="h-info">
          <Format.Title className="ad-mb-2">{title}</Format.Title>
          <Format.Title style={{ display: 'block', fontSize: 20 }}>
            {typeof score === 'undefined' || score < 0 ? <div className="dashed-line" /> : formatIQNumber(score)}
          </Format.Title>
        </div>

        <div className="h-icon" style={{ background: formatColor(color, 0.08) }}>
          {icon}
        </div>
      </div>
      <div className="children-wrapper" style={{ height: isOpen ? 'auto' : 0 }}>
        {children}
      </div>
      <div className="ad-center expand-btn" onClick={() => setIsOpen(bool => !bool)}>
        {intl.get(`intelligence.${isOpen ? 'collapseDetails' : 'checkDetail'}`)}
        &nbsp;
        <DownOutlined rotate={isOpen ? 180 : 0} />
      </div>
    </div>
  );
};

export default memo(ScoreCard);
