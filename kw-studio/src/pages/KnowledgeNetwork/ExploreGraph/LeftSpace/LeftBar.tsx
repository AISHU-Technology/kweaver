import React from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import { Button, Divider, Tooltip } from 'antd';

const LeftBar = (props: any) => {
  const { config = {}, options, selectedItem, leftDrawerKey } = props;
  const { onClickMenu } = props;

  return (
    <div className="iconBox">
      {_.map(options, item => {
        if (!config[item.id] || !config[item.id]?.checked) return null;
        const { id, icon, hasDivider } = item;
        const text = config[item.id]?.alias || item.intl;
        const disabled = (id === 'path' || id === 'neighbors') && selectedItem?.layoutConfig?.default?.isGroup;

        return (
          <React.Fragment key={id}>
            {hasDivider && (
              <div style={{ padding: '0px 15px' }}>
                <Divider style={{ margin: '8px 0px', borderTop: '2px solid rgba(0,0,0,.06)' }} />
              </div>
            )}
            <Tooltip
              title={text}
              key={id}
              placement="left"
              trigger={['click', 'hover']}
              getPopupContainer={triggerNode => triggerNode.parentElement!}
            >
              <Button
                type="link"
                className={classnames('item', { itemHover: !disabled }, { selected: leftDrawerKey === id })}
                style={{ minWidth: 0, padding: 0, border: 'none' }}
                onClick={() => onClickMenu(id)}
                disabled={disabled}
              >
                {icon}
              </Button>
            </Tooltip>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default LeftBar;
