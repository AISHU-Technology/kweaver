import React, { useEffect, useState } from 'react';
import { Button, Select, Dropdown, Menu, message } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';

import serviceModel from '@/services/modelService';
import HOOKS from '@/hooks';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import ModelTable from './ModelTable';

import './style.less';
type FiltersType = {
  name: string;
  status: string;
  orderType: string;
  orderField: string;
  mPodName: string;
};
const INIT_FILTERS = {
  name: '',
  mPodName: '',
  status: '0',
  orderType: 'desc',
  orderField: 'update_time'
};
const ORDER_MENU = [
  { id: 'create_time', intlText: 'knowledge.byCreate' },
  { id: 'update_time', intlText: 'knowledge.byUpdate' },
  { id: 'name', intlText: 'knowledge.byName' }
];
const ModelService = (props: any) => {
  const [filters, setFilters] = useState<FiltersType>(INIT_FILTERS);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { pagination, onUpdatePagination } = HOOKS.PaginationConfig({ page: 1, count: 10 }); // 分页信息

  useEffect(() => {
    getTableData();
  }, [JSON.stringify(filters), pagination?.page]);

  const getTableData = async () => {
    try {
      const { name, mPodName, status, orderField, orderType } = filters;
      const { page, pageSize } = pagination;
      const param: any = { name, mPodName, page, orderField, orderType, size: pageSize };
      if (status !== '0') param.status = parseInt(status);
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
    onChangeFilter({ name: e?.target?.value, mPodName: e?.target?.value });
  }, 300);

  return (
    <div className="kw-p-6 modelServiceRoot">
      <Format.Title>{intl.get('modelService.modelService')}</Format.Title>
      <div className="kw-pt-3 kw-pb-3" style={{ textAlign: 'right' }}>
        <SearchInput
          className="kw-mr-2"
          placeholder={intl.get('modelService.searchServiceName')}
          onChange={e => {
            e.persist();
            searchName(e);
          }}
        />
        <Format.Text className="kw-mr-2">{intl.get('modelService.status')}</Format.Text>
        <Select
          className="kw-mr-2"
          style={{ width: 136, textAlign: 'left' }}
          value={filters.status}
          onChange={e => onChangeFilter({ status: e })}
        >
          <Select.Option value="0">{intl.get('global.all')}</Select.Option>
          <Select.Option value="1">{intl.get('modelService.unpublished')}</Select.Option>
          <Select.Option value="2">{intl.get('modelService.published')}</Select.Option>
        </Select>
        <Dropdown
          className="kw-pointer"
          overlay={menuRule}
          trigger={['click']}
          placement="bottomRight"
          getPopupContainer={triggerNode => triggerNode.parentElement!}
        >
          <Button className="kw-ml-3" style={{ minWidth: 32, padding: 6 }}>
            <IconFont type="icon-paixu11" style={{ fontSize: 18 }} />
          </Button>
        </Dropdown>
      </div>
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
