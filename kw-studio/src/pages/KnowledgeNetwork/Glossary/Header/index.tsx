import React from 'react';
import { Button, Dropdown, Menu, Tooltip } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classnames from 'classnames';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';

import './style.less';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import HELPER from '@/utils/helper';
import { PERMISSION_CODES, PERMISSION_KEYS } from '@/enums';
import Format from '@/components/Format';

const Header = (props: any) => {
  const {
    order,
    orderField,
    delDisabled,
    onSortChange,
    openCreateModal,
    openDeleteModal,
    refreshTableData,
    knData,
    searchValue
  } = props;
  const ORDER_MENU = [
    { id: 'name', title: intl.get('modelLibrary.byName') },
    { id: 'create_time', title: intl.get('modelLibrary.byCreate') },
    { id: 'update_time', title: intl.get('modelLibrary.byUpdate') }
  ];

  const onSelectOrderMenu = ({ key }: any) => {
    if (orderField === key) {
      const targetOrder = order === 'asc' ? 'desc' : 'asc';
      onSortChange({ order: targetOrder });
    } else {
      onSortChange({ orderField: key });
    }
  };

  const onSearchName = _.debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    onSortChange({ searchValue: e?.target?.value });
  }, 300);

  /** 排序下拉选项 */
  const orderMenu = (
    <Menu className="menus" onClick={onSelectOrderMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, title } = item;
        const isSelected = id === orderField;
        const iconDirection = order === 'asc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={classnames('menusItem', { selected: isSelected })}>
            <div className="icon">{isSelected && <IconFont type="icon-fanhuishangji" className={iconDirection} />}</div>
            <div>{title}</div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  return (
    <div className="glossaryHeader kw-space-between">
      <div>
        <ContainerIsVisible
          placeholder={<span style={{ height: 32, display: 'inline-block' }} />}
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_GLOSSARY_CREATE,
            userType: PERMISSION_KEYS.KN_ADD_GLOSSARY,
            userTypeDepend: knData?.__codes
          })}
        >
          <Button type="primary" onClick={() => openCreateModal()}>
            <IconFont type="icon-Add" />
            {intl.get('global.create')}
          </Button>
        </ContainerIsVisible>

        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_GLOSSARY_DELETE
          })}
        >
          <Button className="kw-ml-3" disabled={delDisabled} onClick={() => openDeleteModal()}>
            <IconFont type="icon-lajitong" />
            {intl.get('global.delete')}
          </Button>
        </ContainerIsVisible>
      </div>
      <div className="kw-align-center">
        <SearchInput
          placeholder={intl.get('glossary.glossarySearchPlaceholder')}
          onChange={e => {
            e.persist();
            onSearchName(e);
          }}
        />
        <Dropdown
          overlay={orderMenu}
          trigger={['click']}
          placement="bottomRight"
          getPopupContainer={triggerNode => triggerNode.parentElement!}
        >
          <Format.Button className="kw-ml-3" type="icon" tip={intl.get('glossary.glossarySort')}>
            <IconFont type="icon-paixu11" />
          </Format.Button>
        </Dropdown>
        <Format.Button
          tip={intl.get('global.refresh')}
          type="icon"
          onClick={() => {
            refreshTableData();
          }}
        >
          <IconFont type="icon-tongyishuaxin" />
        </Format.Button>
      </div>
    </div>
  );
};
export default Header;
