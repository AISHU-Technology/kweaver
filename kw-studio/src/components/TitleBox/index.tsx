import React from 'react';
import classNames from 'classnames';
import { Divider } from 'antd';
import './style.less';

type TypeTitleBox = {
  text: string;
  [key: string]: any;
};

const TitleBox: React.FC<TypeTitleBox> = props => {
  const { text, className, ...others } = props;
  return (
    <Divider
      className={classNames(className)}
      dashed
      orientation="left"
      orientationMargin="0"
      {...others}
      style={{ ...others?.style, flex: 1 }}
    >
      <div className={classNames('titleBoxRoot kw-align-center')}>{text}</div>
    </Divider>
  );
};
export default TitleBox;
