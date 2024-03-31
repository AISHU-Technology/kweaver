import React, { useState } from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { Popover } from 'antd';

import Format from '@/components/Format';
import IconFont from '@/components/IconFont';

import './style.less';

const SHAPES = [{ key: 'shapeCircle' }, { key: 'shapeRect' }];

const DisplayHeader = (props: any) => {
  const { selectedShape } = props;
  const { onChangeShape } = props;

  const [popoverVisible, setPopoverVisible] = useState(false);

  return (
    <div className="kw-mt-4 kw-space-between displayStyleHeader">
      <Format.Title>风格</Format.Title>
      <div>
        <Popover
          trigger="click"
          placement="bottomRight"
          overlayClassName="displayStylePopover"
          getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
          onVisibleChange={(visible: any) => setPopoverVisible(visible)}
          content={
            <div className="kw-align-center">
              {_.map(SHAPES, (item, index: number) => {
                const { key } = item;
                return (
                  <div
                    key={key}
                    className={classNames(key, { 'kw-mr-2': index === 0 }, { selectedShape: key === selectedShape })}
                    onClick={() => onChangeShape(key)}
                  />
                );
              })}
            </div>
          }
        >
          <div className="kw-align-center">
            <div className={classNames('kw-mr-2', selectedShape)} />
            <IconFont type="icon-xiala" className="kw-mr-2" rotate={popoverVisible ? 180 : 0} />
          </div>
        </Popover>
      </div>
    </div>
  );
};

export default DisplayHeader;
