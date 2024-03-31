import React, { ReactNode, useState } from 'react';
import { Dropdown, Menu, Tooltip, Select } from 'antd';
import _ from 'lodash';
import classnames from 'classnames';
import intl, { init } from 'react-intl-universal';
import { CaretDownOutlined } from '@ant-design/icons';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';

import { TitleProps, HeaderProps, ButtonConfigProps } from '../types';
import './style.less';

const { Option } = Select;

const Title = (props: TitleProps) => {
  const { title, className, children } = props;
  return (
    <>
      <ContainerIsVisible isVisible={children || title}>
        <div className={classnames(className, 'kw-table-title')}>{children || title}</div>
      </ContainerIsVisible>
    </>
  );
};

const handleList = (list: ButtonConfigProps[]) => {
  return list.map(buttonItem => {
    const {
      key,
      type,
      label,
      orderMenu = [],
      orderField,
      order,
      onOrderMenuClick = () => {},
      onHandle = () => {},
      position,
      tip = true,
      itemDom = null
    } = buttonItem;

    const menuRule = (
      <Menu selectedKeys={[orderField!]} className="kw-table-orderMenu" onClick={e => onOrderMenuClick?.(e)}>
        {_.map(orderMenu, item => {
          const { id, intlText } = item;
          const isSelected = id === orderField;
          const iconDirection = order === 'asc' ? '' : 'kw-table-orderMenu-icon-direction';
          return (
            <Menu.Item key={id}>
              <div className="kw-table-orderMenu-icon">
                {isSelected && <IconFont type="icon-fanhuishangji" className={iconDirection} />}
              </div>
              <div>{intlText}</div>
            </Menu.Item>
          );
        })}
      </Menu>
    );

    if (itemDom) {
      return <div key={key}>{itemDom}</div>;
    }

    switch (type) {
      case 'add':
        return (
          <ContainerIsVisible isVisible={true} key={key}>
            <Tooltip title={label} placement="bottom" visible={false}>
              <Format.Button
                key={`add-btn-${key}`}
                type="primary"
                className="add-btn kw-mr-3"
                onClick={e => onHandle(e)}
              >
                <IconFont type="icon-Add" style={{ color: '#fff' }} />
                {label}
              </Format.Button>
            </Tooltip>
          </ContainerIsVisible>
        );
      case 'add-down':
        return (
          <ContainerIsVisible isVisible={true} key={key}>
            <Tooltip title={label} placement="bottom" visible={false}>
              <Dropdown key={`add-down-${key}`} overlay={menuRule} trigger={['click']} placement="bottomRight">
                <Format.Button
                  key={`add-down-btn-${key}`}
                  type="primary"
                  className="add-down-btn kw-mr-3"
                  onClick={e => onHandle(e)}
                >
                  <IconFont type="icon-Add" style={{ color: '#fff' }} />
                  {label}
                  <CaretDownOutlined />
                </Format.Button>
              </Dropdown>
            </Tooltip>
          </ContainerIsVisible>
        );
      case 'delete':
        return (
          <ContainerIsVisible isVisible={true} key={key}>
            <Tooltip title={label} placement="bottom" visible={false}>
              <Format.Button key={`delete-btn-${key}`} className="delete-btn kw-mr-3" onClick={e => onHandle(e)}>
                <IconFont type="icon-lajitong" />
                {label}
              </Format.Button>
            </Tooltip>
          </ContainerIsVisible>
        );
      case 'order':
        return (
          <Dropdown
            key={`order-${key}`}
            overlay={menuRule}
            trigger={['click']}
            placement="bottomRight"
            getPopupContainer={triggerNode => triggerNode.parentElement!}
          >
            <Format.Button key={`order-btn-${key}`} type="icon" tip={intl.get('global.sort')} tipPosition="top">
              <IconFont type="icon-paixu11" />
            </Format.Button>
          </Dropdown>
        );
      case 'fresh':
        return (
          <Format.Button
            key={`fresh-btn-${key}`}
            type="icon"
            tip={intl.get('global.refresh')}
            tipPosition="top"
            onClick={e => onHandle(e)}
          >
            <IconFont type="icon-tongyishuaxin" />
          </Format.Button>
        );
      default:
        return <div key={key}>{itemDom}</div> || null;
    }
  });
};

const Header: React.FC<HeaderProps> = props => {
  const {
    title,
    className,
    children,
    visible = true,
    showFilter: isFilter_ = false,
    filterConfig,
    renderButtonConfig,
    onFilterClick = () => {},
    onSearchChange = () => {},
    searchPlaceholder = '',
    filterToolsOptions = []
  } = props;

  const [__isFilter, __setIsFilter] = useState(isFilter_);
  const { isFilter, setIsFilter } = filterConfig || {
    isFilter: __isFilter,
    setIsFilter: __setIsFilter
  };

  const leftButtonsList = renderButtonConfig?.filter(item => item.position === 'left') || [];
  const rightButtonsList = renderButtonConfig?.filter(item => item.position === 'right') || [];

  // Handle searches
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange && onSearchChange(e?.target?.value);
  };

  return (
    <ContainerIsVisible isVisible={visible}>
      <div className={classnames('kw-table-header', className)}>
        {children || (
          <>
            {/* 标题 */}
            <Title>{title}</Title>
            {/* 左右按钮容器 */}
            {
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignContent: 'center', padding: '8px 0' }}
              >
                <div className="left">{handleList(leftButtonsList)}</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ContainerIsVisible isVisible={!isFilter_}>
                    <SearchInput
                      placeholder={searchPlaceholder || intl.get('global.search')}
                      className="kw-mr-3 search-input"
                      onChange={e => handleSearch(e)}
                      debounce
                    />
                    {filterToolsOptions.slice(0, 2).map(item => {
                      const { id, label, value, optionList = [], onHandle = () => {}, itemDom = null } = item;
                      return (
                        <div
                          key={id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          className="kw-mr-3"
                        >
                          {label ? (
                            <span className="kw-ellipsis" style={{ flexShrink: 0, marginRight: 10 }} title={label}>
                              {label}
                            </span>
                          ) : null}

                          {itemDom === null ? (
                            <Select
                              getPopupContainer={() => document.body}
                              onChange={value => {
                                onHandle(value);
                              }}
                              style={{ width: 190 }}
                              value={value}
                            >
                              {optionList?.map(item => {
                                return (
                                  <Option key={item.key} value={item.value}>
                                    {item.text}
                                  </Option>
                                );
                              })}
                            </Select>
                          ) : (
                            itemDom
                          )}
                        </div>
                      );
                    })}
                  </ContainerIsVisible>
                  <ContainerIsVisible isVisible={isFilter_}>
                    <Tooltip title={intl.get('global.filter')} placement="bottom" trigger={['hover']}>
                      <Format.Button
                        type="icon"
                        className="shaixuan-btn"
                        tip={intl.get('global.filter')}
                        tipPosition="top"
                        style={{ background: isFilter ? '#f5f5f5' : '' }}
                        onClick={e => {
                          setIsFilter(!isFilter);
                          onFilterClick(e, isFilter);
                        }}
                      >
                        <IconFont type="icon-shaixuan" />
                      </Format.Button>
                    </Tooltip>
                  </ContainerIsVisible>
                  {handleList(rightButtonsList)}
                </div>
              </div>
            }
          </>
        )}
      </div>
    </ContainerIsVisible>
  );
};

export default Header;
