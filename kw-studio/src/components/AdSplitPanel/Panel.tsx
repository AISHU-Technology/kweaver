import React, { CSSProperties } from 'react';
import classNames from 'classnames';

export interface PanelProps {
  className?: string;
  id?: string;
  style?: CSSProperties;
}

const Panel: React.FC<PanelProps> = ({ className, id, style, children }) => {
  const classes = classNames('kw-split-panel-item', className);
  return (
    <div className={classes} id={id} style={style}>
      {children}
    </div>
  );
};

Panel.displayName = 'kw-split-panel-item';

export default Panel;
