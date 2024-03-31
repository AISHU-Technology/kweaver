import React from 'react';
import { Divider } from 'antd';
import classNames from 'classnames';
import intl from 'react-intl-universal';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import useAdHistory from '@/hooks/useAdHistory';

import './style.less';

interface AdExitBarProps {
  exitText?: React.ReactNode;
  title?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onExit?: () => void;
  extraContent?: React.ReactNode;
}

const AdExitBar: React.FC<AdExitBarProps> = props => {
  const { exitText, title, style, className, extraContent, onExit } = props;
  const history = useAdHistory();
  const renderTitle = () => {
    if (typeof title === 'string') {
      if (title.includes('：')) {
        const [label, value] = title.split('：');
        return (
          <span className="kw-align-center">
            <span>{label}</span>
            {value && (
              <>
                <span>：</span>
                <span
                  title={value}
                  className="kw-ellipsis"
                  style={{ maxWidth: 240, display: 'inline-block' }}
                >{`${value}`}</span>
              </>
            )}
          </span>
        );
      }
      return (
        <span title={title} className="kw-ellipsis" style={{ maxWidth: 240, display: 'inline-block' }}>
          {title}
        </span>
      );
    }
    return title;
  };
  return (
    <div className={classNames('kw-exit-bar kw-align-center kw-border-b', className)} style={style}>
      <Format.Button
        type="text"
        onClick={() => {
          if (onExit) {
            onExit();
          } else {
            history.goBack();
          }
        }}
        style={{ display: 'flex' }}
        className="kw-align-center"
      >
        <IconFont type="icon-shangfanye" style={{ fontSize: 12 }} />
        {exitText || intl.get('global.exit')}
      </Format.Button>
      {(title || extraContent) && <Divider type="vertical" style={{ height: 21, margin: '0 12px' }} />}
      {title && renderTitle()}
      {extraContent && <div className="kw-exit-bar-extra kw-flex-item-full-width">{extraContent}</div>}
    </div>
  );
};

export default AdExitBar;
