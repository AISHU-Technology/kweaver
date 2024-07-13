import React, { useEffect, useState } from 'react';
import { Button, Select, Dropdown, Menu, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import serviceModel from '@/services/modelService';
import HOOKS from '@/hooks';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import { Header, FilterOperationContainer } from '@/components/KwTable';
import ModelTable from './ModelTable';
import { M_TYPE, STATUS } from './enum';

import './style.less';
import ExplainTip from '@/components/ExplainTip';
type FiltersType = {
  name: string;
  status: number | string;
  orderType: string;
  orderField: string;
  podName: string;
  type: number;
  cType: number;
};
const INIT_FILTERS = {
  name: '',
  podName: '',
  status: '0',
  orderType: 'desc',
  orderField: 'update_time',
  type: -1,
  cType: -1
};
const ORDER_MENU = [
  { id: 'create_time', intlText: 'knowledge.byCreate' },
  { id: 'update_time', intlText: 'knowledge.byUpdate' },
  { id: 'pod_name', intlText: 'knowledge.byName' }
];
const ModelService = (props: any) => {
  const [filters, setFilters] = useState<FiltersType>(INIT_FILTERS);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ page: 1, count: 10 }); // 分页信息
  const [filterVisible, setFilterVisible] = useState<boolean>(true); // 控制筛选器

  useEffect(() => {
    getTableData();
  }, [JSON.stringify(filters), pagination?.page]);

  const getTableData = async () => {
    try {
      const { name, podName, status, orderField, orderType, cType, type } = filters;
      const { page, pageSize } = pagination;
      const param: any = { name, podName, page, orderField, orderType, size: pageSize };
      if (status !== 0) param.status = status;
      if (cType !== -1) param.cType = cType;
      if (type !== -1) param.type = type;
      setLoading(true);
      const res = await serviceModel.getModelServiceList(param);
      if (res?.res) {
        setTableData(res.res?.data);
        onUpdatePagination({ count: res.res?.total });
        setLoading(false);
      }
      res?.ErrorCode && message.error(res?.Description);
    } catch (err) {
      //
    }
  };

  const onChangeFilter = (data: Partial<FiltersType>) => {
    setFilters(pre => ({ ...pre, ...data }));
    onUpdatePagination({ page: 1 });
  };

  const selectMenu = (e: any) => {
    const { orderType, orderField } = filters;
    if (e.key === orderField) {
      const or = orderType === 'desc' ? 'asc' : 'desc';
      onChangeFilter({ orderType: or });
      return;
    }
    onChangeFilter({ orderField: e.key });
  };

  /**
   * 下拉筛选菜单
   */
  const menuRule = (
    <Menu className="sort-menu-select" onClick={selectMenu}>
      {_.map(ORDER_MENU, item => {
        const { id, intlText } = item;
        const isSelectClass = filters.orderField === id ? 'menu-selected' : '';
        const iconDirection = filters.orderType === 'asc' ? '' : 'direction';

        return (
          <Menu.Item key={id} className={isSelectClass}>
            <div className="kw-align-center">
              <div className="icon">
                {filters?.orderField === id ? <IconFont type="icon-fanhuishangji" className={iconDirection} /> : null}
              </div>
              <div>{intl.get(intlText)}</div>
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const searchName = _.debounce(e => {
    onChangeFilter({ name: e?.target?.value, podName: e?.target?.value });
  }, 300);

  const onCloseFilter = () => {
    onChangeFilter({ name: '', podName: '', cType: -1, type: -1, status: '0' });
  };

  return (
    <div className="modelServiceRoot">
      <Header
        title={intl.get('llmModel.smallModel')}
        showFilter={true}
        filterConfig={{ isFilter: filterVisible, setIsFilter: setFilterVisible }}
        renderButtonConfig={[
          {
            key: '1',
            position: 'right',
            itemDom: (
              <Dropdown
                className="kw-pointer"
                overlay={menuRule}
                trigger={['click']}
                placement="bottomRight"
                getPopupContainer={triggerNode => triggerNode.parentElement!}
              >
                <Format.Button type="icon" style={{ minWidth: 32 }} tip={intl.get('global.sort')} tipPosition="top">
                  <IconFont type="icon-paixu11" />
                </Format.Button>
              </Dropdown>
            )
          }
        ]}
        onFilterClick={onCloseFilter}
      />
      <FilterOperationContainer
        visible={filterVisible}
        onClose={onCloseFilter}
        onSearchChange={(value: any) => {
          onChangeFilter({ name: value, podName: value });
        }}
        filterConfig={{ isFilter: filterVisible, setIsFilter: setFilterVisible }}
        searchPlaceholder={intl.get('modelService.searchServiceName')}
        filterToolsOptions={[
          {
            id: 'cType',
            optionList: [{ value: filters?.cType } as any],
            label: intl.get('modelService.mType'),
            itemDom: (
              <Select
                className="kw-mr-2"
                style={{ width: 190, textAlign: 'left' }}
                value={filters?.cType}
                onChange={(e: any, op: any) => onChangeFilter({ type: op?.type, cType: e })}
              >
                <Select.Option value={-1} type={0}>
                  {intl.get('global.all')}
                </Select.Option>
                {_.map(M_TYPE, item => {
                  return (
                    <Select.Option key={item?.label} value={item?.cType} type={item?.type}>
                      {intl.get(item?.label)}
                    </Select.Option>
                  );
                })}
              </Select>
            )
          },
          {
            id: 'status',
            optionList: [{ value: filters?.status } as any],

            label: intl.get('modelService.status'),
            itemDom: (
              <Select
                style={{ width: 190, textAlign: 'left' }}
                value={filters.status}
                onChange={e => onChangeFilter({ status: e })}
              >
                <Select.Option value="0">{intl.get('global.all')}</Select.Option>
                <Select.Option value="1">{intl.get('modelService.unpublished')}</Select.Option>
                <Select.Option value="2">{intl.get('modelService.published')}</Select.Option>
              </Select>
            )
          }
        ]}
      />
      <ModelTable
        tableData={tableData}
        filters={filters}
        pagination={pagination}
        loading={loading}
        onUpdatePagination={onUpdatePagination}
        onChangeFilter={onChangeFilter}
      />
    </div>
  );
};
export default ModelService;
