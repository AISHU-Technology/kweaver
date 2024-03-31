import { Select, Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import ResourceDropdown from '@/pages/CognitiveApplication/AnalysisServiceList/ResourceDropdown';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import { ArrowDownOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';
import _ from 'lodash';

import HELPER from '@/utils/helper';
import Format from '@/components/Format';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';

import { DESC, FILTER_OPTION, SORTER_MENU, INIT_STATE, FILTER_ENV_OPTION } from '../enum';
import ExplainTip from '@/components/ExplainTip';
const { Option } = Select;
export default function FilterHeader(props: any) {
  const { tableState, correlateGraph, onChange, knData, onShowModal, onSetModalEditData } = props;
  const [showFilter, setShowFilter] = useState<boolean>(true);

  const onChangeResource = (value: any, type: any) => {
    if (type === 'kg') return onGraphChange(value);
    if (type === 'knw') onChange({ page: 1, knw_id: value, kg_id: '-1' });
  };

  /**
   * 按图谱筛选
   * @param kgId 图谱id
   */
  const onGraphChange = (kgId?: string) => {
    onChange({ page: 1, kg_id: kgId });
  };

  /**
   * 按状态筛选
   * @param status 发布状态
   */
  const onStatusChange = (status?: number) => {
    onChange({ page: 1, status });
  };

  /**
   * 筛选应用环境
   * @param env 应用环境
   */
  const onAppEnvChange = (env?: number) => {
    onChange({ page: 1, env });
  };

  /**
   * 排序
   */
  const onSortMenuClick = (key: any) => {
    const { order_type, order_field } = tableState;
    onChange({
      order_field: key,
      order_type: order_field === key ? (order_type === 'desc' ? 'asc' : 'desc') : order_type
    });
  };

  const onRefresh = () => {
    onChange();
  };

  /**
   * 新建
   */
  const onCreate = () => {
    onShowModal(true);
    onSetModalEditData((pre: any) => {
      return {
        ...pre,
        env: '0',
        name: '',
        description: '',
        init: true,
        id: ''
      };
    });
  };

  /**
   * 触发搜索
   */
  const onSearch = (query: any) => {
    onChange({ page: 1, query });
  };

  /**
   * 关闭筛选器，清空
   */
  const onCloseFilter = (show: boolean) => {
    setShowFilter(show);
    const isEqual = _.isEqual(
      _.pick(tableState, ['query', 'status', 'kg_id', 'knw_id']),
      _.pick(INIT_STATE, ['query', 'status', 'kg_id', 'knw_id'])
    );
    const { query, status, kg_id, knw_id, page } = INIT_STATE;

    if (!show && !isEqual) {
      onChange({ query, status, kg_id, knw_id, page });
    }
  };

  return (
    <div>
      <div className="kw-space-between kw-mb-4">
        <ContainerIsVisible
          placeholder={<span style={{ height: 32, display: 'inline-block' }} />}
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_APP_CUSTOM_CREATE,
            userType: PERMISSION_KEYS.KN_ADD_SERVICE
            // userTypeDepend: knData?.__codes
          })}
        >
          <Format.Button type="primary" onClick={onCreate}>
            <IconFont type="icon-Add" style={{ color: '#fff', fontSize: 14 }} />
            {intl.get('exploreAnalysis.create')}
          </Format.Button>
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
              <Menu selectedKeys={[tableState.order_field]} onClick={({ key }) => onSortMenuClick(key)}>
                {SORTER_MENU.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState.order_type === DESC.slice(0, 4) ? 0 : 180}
                      style={{ opacity: tableState.order_field === key ? 0.8 : 0, fontSize: 15 }}
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
        <div className="kw-align-center" style={{ height: 48, background: 'rgba(0,0,0,0.02)' }}>
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
            <span className="kw-ellipsis" style={{ flexShrink: 0 }} title={intl.get('cognitiveService.analysis.state')}>
              {intl.get('cognitiveService.analysis.state')}
            </span>

            <Select
              className="kw-mr-3 kw-ml-3 select-box"
              style={{ width: 200 }}
              defaultValue={-1}
              onChange={onStatusChange}
            >
              {FILTER_OPTION.map(item => {
                return (
                  <Option key={item.key} value={item.key}>
                    {item.text}
                  </Option>
                );
              })}
            </Select>

            <span className="kw-ellipsis" style={{ flexShrink: 0 }} title={intl.get('customService.env')}>
              {intl.get('customService.env')}
            </span>

            <Select
              className="kw-mr-3 kw-ml-3 select-box"
              style={{ width: 200 }}
              defaultValue={-1}
              onChange={onAppEnvChange}
            >
              {FILTER_ENV_OPTION.map(item => {
                return (
                  <Option key={item.key} value={item.key}>
                    {item.text}
                  </Option>
                );
              })}
            </Select>

            <ResourceDropdown
              knwList={correlateGraph}
              filters={tableState}
              onChangeResource={(value: any, type: 'kg' | 'knw') => onChangeResource(value, type)}
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
}
