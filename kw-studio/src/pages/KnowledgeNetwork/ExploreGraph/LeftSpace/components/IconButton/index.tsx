import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { Divider, Tooltip } from 'antd';

import './style.less';

type IconButtonType = {
  activeKey: string;
  item: { id: string; icon: any; title: string; hasDivider?: boolean };
  onClickIcon: (id: string) => void;
};
const IconButton = (props: IconButtonType) => {
  const {
    activeKey,
    onClickIcon,
    item: { id, icon, title, hasDivider }
  } = props;
  const selected = activeKey === id;

  return (
    <div className="iconButtonRoot">
      {hasDivider && (
        <div style={{ padding: '0px 15px' }}>
          <Divider style={{ margin: '8px 0px', borderTop: '2px solid rgba(0,0,0,.06)' }} />
        </div>
      )}
      <Tooltip title={title} key={id} placement="left" trigger={['click', 'hover']}>
        <div className={classnames('item kw-center', { selected })} onClick={() => onClickIcon(id)}>
          <span className="kw-pl-1 kw-pt-1">{icon}</span>
        </div>
      </Tooltip>
    </div>
  );
};

export default IconButton;
