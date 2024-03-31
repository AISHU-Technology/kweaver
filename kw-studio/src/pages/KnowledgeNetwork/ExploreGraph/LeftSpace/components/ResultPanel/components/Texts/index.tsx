import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import './style.less';

export interface TextsProps {
  className?: string;
  style?: React.CSSProperties;
  texts?: string[];
}

const Texts = (props: TextsProps) => {
  const { className, style, texts } = props;

  return (
    <div className={classNames(className, 'canvas-res-panel-texts')} style={style}>
      {_.map(texts, (text, index) => (
        <div key={String(index)} className="text-row kw-w-100">
          {text}
        </div>
      ))}
    </div>
  );
};

export default Texts;
