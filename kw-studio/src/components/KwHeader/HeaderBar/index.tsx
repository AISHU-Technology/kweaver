import _ from 'lodash';
import React from 'react';
import { Avatar, Dropdown, Menu, MenuProps } from 'antd';
import { UserOutlined, DownOutlined } from '@ant-design/icons';

import IconFont from '@/components/IconFont';

import './style.less';

interface ExtraElementsType {
  key: string;
  icon?: string;
  label: string | React.ReactElement;
  onClick?: (key: string) => void;
}

interface AccountItemType {
  key: string;
  label: string;
  divider?: boolean;
  selectable?: boolean;
  children?: Array<{
    key: string;
    label: string;
  }>;
}

interface AccountType {
  name: any;
  items?: Array<AccountItemType>;
  onClick?: (keys: Array<string>) => void;
}

interface HeaderBarProps {
  logo?: string;
  account?: AccountType;
  extraElements?: Array<ExtraElementsType>;
}

const HeaderBar = (props: HeaderBarProps) => {
  const { logo, extraElements, account } = props;

  const clickHandle = (item: AccountItemType) => {
    return account?.onClick!([item.key]) as MenuProps['onClick'];
  };

  const renderAccountMenu = () => {
    return (
      <Menu>
        {_.map(account?.items, (item, index) => {
          return item.children ? (
            <React.Fragment key={`${item.key}-${index}`}>
              <Menu.SubMenu
                key={item.key}
                style={{ display: 'grid', width: 180, height: 40, alignItems: 'center' }}
                title={item.label}
              >
                {_.map(item.children, child => {
                  return (
                    <Menu.Item key={child.key} style={{ width: 180, height: 40 }}>
                      {child.label}
                    </Menu.Item>
                  );
                })}
              </Menu.SubMenu>
            </React.Fragment>
          ) : (
            <React.Fragment key={`${item.key}-${index}`}>
              <Menu.Item
                key={item.key}
                style={{ width: 180, height: 40 }}
                disabled={item.selectable !== undefined ? !item.selectable : false}
                onClick={() => clickHandle(item)}
              >
                {item.label}
              </Menu.Item>
              {item.divider === true && index !== account!.items!.length - 1 && (
                <Menu.Divider key={`${item.key}-divider`} />
              )}
            </React.Fragment>
          );
        })}
      </Menu>
    );
  };

  const renderExtraElements = () => {
    return _.map(extraElements, element => {
      return (
        <div key={element.key} onClick={() => (element.onClick ? element.onClick(element.key) : undefined)}>
          {element.icon && <IconFont type={element.icon} style={{ fontSize: 16 }} />}
          {element.label && element.label}
        </div>
      );
    });
  };

  return (
    <div className="kw-header-bar-content">
      {logo && <img className="kw-header-bar-content-logo" src={`data:image/png;base64,${logo}`}></img>}
      {extraElements && <div className="kw-header-bar-content-left-area">{renderExtraElements()}</div>}
      {account && (
        <div className="kw-header-bar-content-right-area">
          <Dropdown
            className="kw-header-bar-content-right-area-drop-down"
            dropdownRender={renderAccountMenu}
            trigger={['click']}
          >
            <a onClick={e => e.preventDefault()}>
              <Avatar size={26} icon={<UserOutlined />} />
              <div className="kw-header-bar-content-right-area-name">{account.name}</div>
              <DownOutlined className="kw-header-bar-content-right-area-drop-down-arrow" />
            </a>
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default HeaderBar;
