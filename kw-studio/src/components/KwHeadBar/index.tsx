import React from 'react';
import { Avatar, Dropdown, Menu, MenuProps } from 'antd';
import _ from 'lodash';
import { UserOutlined, DownOutlined } from '@ant-design/icons';
import './style.less';
import IconFont from '../IconFont';

interface ExtraElementsType {
  icon?: string;
  key: string;
  label: string | React.ReactElement;
  onClick?: (key: string) => void;
}

interface AccountItemType {
  // account menu key
  key: string;
  // account menu label
  label: string;
  // selectable default is true
  selectable?: boolean;
  // divider default is false
  divider?: boolean;
  // account menu submenu
  children?: Array<{
    key: string;
    label: string;
  }>;
}

interface AccountType {
  name: string;
  items?: Array<AccountItemType>;
  onClick?: (keys: Array<string>) => void;
}

interface KwHeadBarProps {
  logo?: string;
  extraElements?: Array<ExtraElementsType>;
  account?: AccountType;
}

const KwHeadBar = (props: KwHeadBarProps) => {
  const { logo, extraElements, account } = props;

  const clickHandle = (item: AccountItemType) => {
    return account?.onClick!([item.key]) as MenuProps['onClick'];
  };

  const renderAccountMenu = () => {
    return (
      <Menu>
        {_.map(account?.items, (item, index) => {
          return item.children ? (
            <div key={`${item.key}-${index}`}>
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
            </div>
          ) : (
            <div key={`${item.key}-${index}`}>
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
            </div>
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
            overlay={renderAccountMenu}
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

export default KwHeadBar;
