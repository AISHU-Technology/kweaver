import React, { useState, useCallback } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Dropdown, Menu, Button, Input } from 'antd';

import HELPER from '@/utils/helper';
import IconFont from '@/components/IconFont';
import { Header } from '@/components/KwTable';
import Format from '@/components/Format';

import { TYPE_CREATE, TYPE_OVER } from '../enums';

import './style.less';

interface SortType {
  rule: string;
  order: string;
}
interface HeaderType {
  sort: SortType;
  disabledOver: boolean;
  disabledImport: boolean;
  disabledDelete: boolean;
  onChangeSort: (data: SortType) => void;
  onDeleteBatch: () => void;
  onOpenCreateModel: (type: string) => void;
  onChangeFilter: (data: any) => void;
}

const ORDER_MENU = [
  { id: 'create_time', title: intl.get('modelLibrary.byCreate') },
  { id: 'update_time', title: intl.get('modelLibrary.byUpdate') },
  { id: 'name', title: intl.get('modelLibrary.byName') }
];

const ModelLibraryHeader = (props: HeaderType) => {
  const { sort, disabledOver, disabledImport, disabledDelete } = props;
  const { onChangeSort, onDeleteBatch, onChangeFilter, onOpenCreateModel } = props;
  const [filterStr, setFilterStr] = useState('');

  /** 筛选模型 input 变更 */
  const onChangeInput = useCallback(
    _.debounce((value: string) => {
      if (!value) {
        onChangeFilter({});
      } else {
        onChangeFilter({ name: value });
      }
    }, 300),
    []
  );

  /** 创建模型选项 */
  const createMenu = (
    <Menu className="menus" onClick={(e: any) => onOpenCreateModel(e?.key)}>
      <Menu.Item key={TYPE_CREATE} className="menusItem" disabled={disabledImport}>
        {intl.get('modelLibrary.asANewModel')}
      </Menu.Item>
      <Menu.Item key={TYPE_OVER} className="menusItem" disabled={disabledOver}>
        {intl.get('modelLibrary.asACoverModel')}
      </Menu.Item>
    </Menu>
  );

  /** 排序变更 */
  const onSelectOrderMenu = (e: any) => {
    const key = e?.key;
    if (sort.rule === key) {
      if (sort.order === 'asc') {
        onChangeSort({ ...sort, order: 'desc' });
      } else {
        onChangeSort({ ...sort, order: 'asc' });
      }
    } else {
      onChangeSort({ rule: key, order: 'desc' });
    }
  };
  /** 排序下拉选项 */
  const orderMenu = (
    <Menu className="menus" onClick={onSelectOrderMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, title } = item;
        const isSelected = id === sort.rule;
        const iconDirection = sort?.order === 'asc' ? '' : 'direction';

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
    <div className="modelLibraryHeaderRoot">
      {/* <div className="kw-center">
        <Dropdown
          overlay={createMenu}
          trigger={['hover']}
          placement="bottomLeft"
          disabled={disabledImport}
          getPopupContainer={triggerNode => triggerNode.parentElement!}
        >
          <Button type="primary" icon={<IconFont type="icon-daoru" />}>
            {intl.get('modelLibrary.import')}
          </Button>
        </Dropdown>

        <Button
          className="kw-ml-2"
          icon={<IconFont type="icon-lajitong" />}
          disabled={disabledDelete}
          onClick={onDeleteBatch}
        >
          {intl.get('modelLibrary.delete')}
        </Button>
      </div> */}

      {/* <div className="kw-center">
        <Input
          style={{ width: 272 }}
          allowClear
          suffix={!filterStr && <IconFont type="icon-sousuo" style={{ cursor: 'pointer' }} />}
          placeholder={intl.get('modelLibrary.searchForModelNameOrTag')}
          onChange={(e: any) => {
            const value = e.target.value;
            setFilterStr(value);
            onChangeInput(e.target.value);
          }}
        />
        <Dropdown
          overlay={orderMenu}
          trigger={['click']}
          placement="bottomRight"
          getPopupContainer={triggerNode => triggerNode.parentElement!}
        >
          <Button className="sortIcon">
            <IconFont type="icon-paixu11" />
          </Button>
        </Dropdown>
      </div> */}
      <Header
        title={intl.get('modelFactory.customModel')}
        showFilter={false}
        renderButtonConfig={[
          {
            key: '1',
            position: 'left',
            itemDom: (
              <Dropdown
                overlay={createMenu}
                trigger={['hover']}
                placement="bottomLeft"
                disabled={disabledImport}
                getPopupContainer={triggerNode => triggerNode.parentElement!}
              >
                <Format.Button type="primary" icon={<IconFont type="icon-shangchuan" />}>
                  {intl.get('modelLibrary.import')}
                </Format.Button>
              </Dropdown>
            )
          },
          {
            key: '2',
            position: 'left',
            itemDom: (
              <Format.Button
                type="default"
                className={classnames('kw-ml-3', {
                  'delete-btn': disabledDelete
                })}
                icon={<IconFont type="icon-lajitong" />}
                disabled={disabledDelete}
                onClick={onDeleteBatch}
              >
                {intl.get('modelLibrary.delete')}
              </Format.Button>
            )
          },
          {
            key: '3',
            position: 'right',
            itemDom: (
              <Dropdown
                overlay={orderMenu}
                trigger={['click']}
                placement="bottomRight"
                getPopupContainer={triggerNode => triggerNode.parentElement!}
              >
                <Format.Button type="icon" className="sortIcon" tip={intl.get('global.sort')} tipPosition="top">
                  <IconFont type="icon-paixu11" />
                </Format.Button>
              </Dropdown>
            )
          }
        ]}
        onSearchChange={(value: any) => {
          setFilterStr(value);
          onChangeInput(value);
        }}
        searchPlaceholder={intl.get('modelLibrary.searchForModelNameOrTag')}
        // filterToolsOptions={filterToolsOptions}
      />
    </div>
  );
};

export default ModelLibraryHeader;
