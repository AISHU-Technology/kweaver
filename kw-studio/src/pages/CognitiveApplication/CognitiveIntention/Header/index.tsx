import { Button, Select, Dropdown, Menu } from 'antd';
import React, { useState } from 'react';
import ResourceDropdown from '@/pages/CognitiveApplication/AnalysisServiceList/ResourceDropdown';
import SearchInput from '@/components/SearchInput';
import ComposInput from '@/components/ComposInput';

import IconFont from '@/components/IconFont';
import { ArrowDownOutlined, CaretDownOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';
import _ from 'lodash';

import HELPER from '@/utils/helper';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import Format from '@/components/Format';

import { DESC, FILTER_OPTION, SORTER_MENU, INIT_STATE } from '../enum';
import ExplainTip from '@/components/ExplainTip';
const { Option } = Select;
export default function FilterHeader(props: any) {
  const {
    tableState,
    correlateGraph,
    onCreate,
    onStatusChange,
    onGraphChange,
    onSearch,
    onSortMenuClick,
    onRefresh,
    onKnwChange,
    onChange
  } = props;
  const [query, setQuery] = useState<any>(tableState?.query);
  const [showFilter, setShowFilter] = useState<boolean>(true);

  const onChangeResource = (value: any, type: any) => {
    if (type === 'kg') return onGraphChange(value);
    if (type === 'knw') onKnwChange(value);
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
      setQuery('');
      onChange({ query, status, kg_id, knw_id, page });
    }
  };
  return (
    <div>
      <div className="kw-space-between">
        <ContainerIsVisible placeholder={<span style={{ height: 32, display: 'inline-block' }} />}>
          <Button type="primary" onClick={() => onCreate()}>
            <IconFont type="icon-Add" style={{ color: '#fff' }} />
            {intl.get('exploreAnalysis.create')}
          </Button>
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
        <div className="kw-align-center kw-mt-4" style={{ height: 48, background: 'rgba(0,0,0,0.02)' }}>
          <div style={{ flex: 1 }}>
            <ComposInput
              style={{ width: '100%' }}
              useAntd={true}
              prefix={(<IconFont type="icon-sousuo" className="kw-c-watermark" />) as any}
              bordered={false}
              allowClear
              value={query}
              placeholder={intl.get('cognitiveService.analysis.search')}
              onChange={(e: any) => {
                e.persist();
                setQuery(e?.target?.value);
                onSearch(e?.target?.value);
              }}
            />
          </div>
          <div className="kw-align-center">
            <span className="kw-ellipsis" style={{ flexShrink: 0 }} title={intl.get('cognitiveService.analysis.state')}>
              {intl.get('cognitiveService.analysis.state')}
            </span>

            <Select
              className="kw-mr-3 kw-ml-3"
              style={{ width: 200 }}
              getPopupContainer={trigger => trigger?.parentElement || document.body}
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
