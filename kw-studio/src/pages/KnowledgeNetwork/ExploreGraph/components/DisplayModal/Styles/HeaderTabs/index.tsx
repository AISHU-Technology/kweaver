import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';

import './style.less';

const HeaderTabs = (props: any) => {
  const { items, selected } = props;
  const { onChangeSelected } = props;
  return (
    <div className="styleHeaderTabsRoot">
      {_.map(items, item => {
        const { key, label } = item;
        return (
          <div
            key={key}
            className={classnames('headerItem', { headerItemSelected: key === selected })}
            onClick={onChangeSelected(key)}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

export default HeaderTabs;
