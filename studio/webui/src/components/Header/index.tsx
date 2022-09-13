import React, { useMemo } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { Button } from 'antd';

import './style.less';

type OperationType = {
  icon?: any;
  text?: string;
  style?: any;
  float?: string;
  component?: () => React.FunctionComponent | JSX.Element;
  onClick?: () => void;
};
export type HeaderType = {
  logo?: any;
  style?: any;
  className?: string;
  operation?: OperationType[];
};

const ComOperation = (props: { source: OperationType[] }) => {
  const { source } = props;
  return (
    <React.Fragment>
      {_.map(source, (item, index) => {
        const { icon, text, style, component, onClick } = item;
        if (component) return <React.Fragment key={index}>{component()}</React.Fragment>;
        return (
          <Button
            key={`${text}_${index}`}
            className="operation"
            type="link"
            icon={icon}
            style={style}
            onClick={onClick}
          >
            {text}
          </Button>
        );
      })}
    </React.Fragment>
  );
};

const Header = (props: HeaderType) => {
  const { logo, style = {}, className = {}, operation = [] } = props;

  const { leftOP, rightOP } = useMemo(() => {
    const leftOP: OperationType[] = [];
    const rightOP: OperationType[] = [];

    _.forEach(operation || [], (item: any) => {
      if (item?.float === 'left') return leftOP.push(item);
      if (item?.float === 'right') return rightOP.push(item);
      rightOP.push(item);
    });

    return { leftOP, rightOP };
  }, [operation]);

  return (
    <div className={classnames('headerRootC', 'ad-space-between', className)} style={style}>
      <div className="ad-align-center">
        {!!logo && <img className="logo" src={logo} alt="logo" />}
        <ComOperation source={leftOP} />
      </div>
      <div className="ad-align-center">
        <ComOperation source={rightOP} />
      </div>
    </div>
  );
};

export default Header;
