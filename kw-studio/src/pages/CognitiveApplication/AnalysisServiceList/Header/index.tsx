import React, { useState } from 'react';
import { Button, Select, Dropdown, Menu } from 'antd';
import ResourceDropdown from '../ResourceDropdown';
import SearchInput from '@/components/SearchInput';

import IconFont from '@/components/IconFont';
import { ArrowDownOutlined, CaretDownOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';
import _ from 'lodash';

import HELPER from '@/utils/helper';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import Format from '@/components/Format';

import { DESC, ASC, SORTER_MENU, QUERY_OPTION, FILTER_OPTION, INIT_STATE } from '../enum';
import ExplainTip from '@/components/ExplainTip';
const FilterHeader = (props: any) => {
  const { onSelectMenu, onChange } = props;
  const { kgList, tableState } = props;
  const [showFilter, setShowFilter] = useState<boolean>(true);
  const onChangeResource = (value: any, type: any) => {
    if (type === 'kg') return onGraphChange(value);
    if (type === 'knw') onKnwChange(value);
  };

  /**
   * 按状态筛选
   * @param status 发布状态
   */
  const onStatusChange = (status?: number) => {
    onChange({ page: 1, status });
  };

  /**
   * 按图谱筛选
   * @param kgId 图谱id
   */
  const onGraphChange = (kgId?: string) => {
    onChange({ page: 1, kg_id: kgId });
  };

  /**
   * 按网络筛选
   * @param knwId 知识网络id
   */
  const onKnwChange = (knwId: string) => {
    onChange({ page: 1, knw_id: knwId, kg_id: '-1' });
  };

  /**
   * 按查询方式筛选
   */
  const onQueryChange = (mode: string) => {
    onChange({ page: 1, operation_type: mode });
  };

  /**
   * 触发搜索
   */
  const onSearch = (query: any) => {
    onChange({ page: 1, query });
  };

  /**
   * 点击排序按钮
   */
  const onSortMenuClick = (key: string) => {
    const { order_field, order_type } = tableState;
    onChange({
      page: 1,
      order_field: key,
      order_type:
        order_field === key ? (order_type === DESC.slice(0, 4) ? ASC.slice(0, 3) : DESC.slice(0, 4)) : order_type
    });
  };

  /**
   * 刷新
   */
  const onRefresh = () => {
    onChange({});
  };

  /**
   * 关闭筛选器，清空
   */
  const onCloseFilter = (show: boolean) => {
    setShowFilter(show);
    const isEqual = _.isEqual(
      _.pick(tableState, ['query', 'status', 'kg_id', 'knw_id', 'operation_type']),
      _.pick(INIT_STATE, ['query', 'status', 'kg_id', 'knw_id', 'operation_type'])
    );
    const { query, status, kg_id, knw_id, operation_type } = INIT_STATE;
    if (!show && !isEqual) {
      onChange({ query, status, kg_id, knw_id, operation_type, page: 1 });
    }
  };

  /**
   * 下拉框菜单
   */
  const menu = () => {
    return (
      <Menu style={{ minWidth: '92px', padding: '0px' }} onClick={onSelectMenu}>
        <Menu.Item key="add">
          <IconFont type="icon-Add" style={{ marginRight: 6 }} />
          {intl.get('global.create')}
        </Menu.Item>
        <Menu.Item key="import">
          <IconFont type="icon-daoru" style={{ marginRight: 6 }} />
          {intl.get('global.import')}
        </Menu.Item>
      </Menu>
    );
  };
  return (
    <div>
      <div className="kw-space-between">
        <ContainerIsVisible
          placeholder={<span style={{ height: 32, display: 'inline-block' }} />}
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_APP_GRAPHANAL_CREATE,
            userType: PERMISSION_KEYS.KN_ADD_SERVICE
          })}
        >
          <Dropdown
            overlay={menu}
            placement="bottomRight"
            getPopupContainer={triggerNode => triggerNode?.parentElement || document.body}
          >
            <Button type="primary">
              <IconFont type="icon-Add" />
              {intl.get('global.create')}
              <CaretDownOutlined className="kw-ml-1 down-arrow" />
            </Button>
          </Dropdown>
        </ContainerIsVisible>
        <div>
          <ExplainTip title={intl.get('global.filter')}>
            <Format.Button
              type="icon"
              style={{ background: showFilter ? 'rgba(0,0,0,0.04)' : '' }}
              onClick={() => onCloseFilter(!showFilter)}
            >
              <IconFont type="icon-shaixuan" />
            </Format.Button>
          </ExplainTip>

          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            overlay={
              <Menu selectedKeys={[tableState?.order_field]} onClick={({ key }) => onSortMenuClick(key)}>
                {SORTER_MENU.map(({ key, text }: any) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState?.order_type === DESC.slice(0, 4) ? 0 : 180}
                      style={{ opacity: tableState?.order_field === key ? 0.8 : 0, fontSize: 15 }}
                    />
                    {text}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <ExplainTip title={intl.get('global.sort')}>
              <Format.Button type="icon">
                <IconFont type="icon-paixu11" className="sort-icon" />
              </Format.Button>
            </ExplainTip>
          </Dropdown>
          <ExplainTip title={intl.get('global.refresh')}>
            <Format.Button type="icon" title={intl.get('global.refresh')} onClick={onRefresh}>
              <IconFont type="icon-tongyishuaxin" />
            </Format.Button>
          </ExplainTip>
        </div>
      </div>
      {showFilter && (
        <div className="kw-align-center kw-mt-4" style={{ height: 48, background: 'rgba(0,0,0,0.02)' }}>
          <div style={{ flex: 1 }}>
            <SearchInput
              style={{ width: '100%' }}
              prefix={(<IconFont type="icon-sousuo" className="kw-c-watermark" />) as any}
              bordered={false}
              allowClear
              placeholder={intl.get('cognitiveService.analysis.search')}
              onChange={(e: any) => {
                e.persist();
                onSearch(e?.target?.value);
              }}
              debounce
            />
          </div>
          <div className="kw-align-center">
            <span className="kw-ellipsis" style={{ flexShrink: 0 }} title={intl.get('cognitiveService.analysis.query')}>
              {intl.get('cognitiveService.analysis.query')}
            </span>

            <Select
              className="kw-mr-3 kw-ml-3 "
              style={{ width: 200 }}
              getPopupContainer={trigger => trigger.parentElement}
              defaultValue={intl.get('cognitiveService.analysis.all')}
              onChange={onQueryChange}
            >
              {QUERY_OPTION.map(item => {
                return (
                  <Select.Option key={item.key} value={item.value}>
                    {item.text}
                  </Select.Option>
                );
              })}
            </Select>
            <span className="kw-ellipsis" style={{ flexShrink: 0 }} title={intl.get('cognitiveService.analysis.state')}>
              {intl.get('cognitiveService.analysis.state')}
            </span>

            <Select
              className="kw-mr-3 kw-ml-3 "
              style={{ width: 200 }}
              getPopupContainer={trigger => trigger.parentElement}
              defaultValue={-1}
              onChange={onStatusChange}
            >
              {FILTER_OPTION.map(item => {
                return (
                  <Select.Option key={item.key} value={item.key}>
                    {item.text}
                  </Select.Option>
                );
              })}
            </Select>
            <ResourceDropdown
              knwList={kgList}
              filters={tableState}
              onChangeResource={(value: any, type) => onChangeResource(value, type)}
            />
            <ExplainTip title={intl.get('global.clearFilter')}>
              <IconFont
                type="icon-guanbiquxiao"
                className="kw-ml-3 kw-mr-3"
                onClick={() => onCloseFilter(!showFilter)}
              />
            </ExplainTip>
          </div>
        </div>
      )}
    </div>
  );
};
export default FilterHeader;
