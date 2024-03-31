import React, { useEffect, useState } from 'react';
import { Pagination } from 'antd';
import _ from 'lodash';
import intl from 'react-intl-universal';
import classNames from 'classnames';
import { GraphIcon } from '@/utils/antv6';
import ResizeTable from '@/components/ResizeTable';
import SearchInput from '@/components/SearchInput';
import NoResult from '@/assets/images/noResult.svg';

import './style.less';

type TableListProps = {
  classPage: number; // 当前页码
  dataList: any; // 表格数据
  searchConfig?: any; // 筛选条件
  checkData: any; // 勾选的数据
  addedIds?: any; // 已添加的点的id
  isSelectAdd: any; // 是否为选择添加
  onSearchTag: (value: any) => void; // 搜索类
  onPageChange: (page: number) => void; // 换页
  changeCheckData: (param: any) => void; // 勾选数据
};
const ENTITY_SIZE = 10;
const TableList = (props: TableListProps) => {
  const { classPage, searchConfig, dataList, checkData, addedIds, isSelectAdd } = props;
  const { changeCheckData, onPageChange, onSearchTag } = props;
  const [myPagination, setMyPagination] = useState<Record<string, any>>({}); // 基于类的分页
  const [tableData, setTableData] = useState<any>([]);

  useEffect(() => {
    const pagination = _.cloneDeep(myPagination);
    _.forEach(dataList?.result, data => {
      const tag = data?.tag;
      const total = data?.vertexs?.length || data?.vertexes?.length;
      if (!pagination?.[tag]) {
        pagination[tag] = { page: 1, size: 10, total };
      }
    });
    onChangeTag(dataList?.result?.[0]);
    setMyPagination(pagination);
  }, [dataList]);

  // 获取选中类下的实体表格数据
  const getTableData = (datasource: any, tag: string) => {
    const { page } = myPagination[tag] || {};
    const listData = datasource?.vertexs || datasource?.vertexes;

    const tableData = _.map(listData, entity => {
      const { id, color, properties } = entity;
      const proMap = _.keyBy(properties, 'tag');
      const pro = proMap[tag]?.props || properties;
      const proObj = _.reduce(pro, (res, p) => ({ ...res, [p.alias || p.name]: p.value }), {});
      return { id, tag, color, ..._.omit(proObj, 'id') };
    });

    const start = (page - 1) * ENTITY_SIZE;
    let arr = tableData.slice(start);

    if (start + ENTITY_SIZE < tableData.length) {
      arr = tableData.slice(start, start + ENTITY_SIZE);
    }
    return arr;
  };

  // 处理表头
  const getColumns = (list: any) => {
    const tag = list?.tag || list?.tags?.[0];
    const columnsKeys: any = [];
    const defaultStr = ['_ds_id_', '_name_', '_timestamp_'];
    const filterProperties = _.filter(searchConfig, item => item?.tag === tag)?.[0]?.properties || [];

    // 按照筛选的条件，做一个排序，把筛选的字段排在前面
    const columns = _.map(filterProperties, (item: any) => {
      const key = item.alias || item.name;
      columnsKeys.push(key);
      return { key, dataIndex: key, title: key, width: 200, ellipsis: true };
    });

    const firstItem = (list.vertexs || list.vertexes)?.[0];
    const properties = firstItem?.properties;
    const defaultKey = firstItem?.default_property?.alias || firstItem?.default_property?.name;
    const proMap = _.keyBy(properties, 'tag');
    const pro = proMap[tag]?.props || properties;

    _.forEach(pro, p => {
      if (_.includes(columnsKeys, p.name) || _.includes(defaultStr, p.name)) return;
      const key = p.alias || p.name;
      columns.push({ key, dataIndex: key, title: key, width: 200, ellipsis: true });
    });
    // 唯一标识前置
    columns.sort((a, b) => (a.key === defaultKey ? -1 : 0));
    return columns;
  };

  // 左侧类的列表分页
  const changeEntitySize = (page: number, tag: string) => {
    const pagination = _.cloneDeep(myPagination);
    pagination[tag] = { ...pagination[tag], page };

    setMyPagination(pagination);
  };

  // 选中单个数据
  const changeSelectedKeys = (record: any, selected: any, tag: any) => {
    const select = _.cloneDeep(checkData);
    if (selected) {
      if (select?.[tag]) {
        select[tag] = [...select[tag], record?.id];
      } else {
        select[tag] = [record?.id];
      }
    } else {
      const ids = _.filter(select?.[tag], item => item !== record?.id);
      select[tag] = ids;
    }

    changeCheckData(select);
  };

  // 全选
  const onSelectAll = (selected: any, data: any, tag: any) => {
    let select = _.cloneDeep(checkData);
    if (selected) {
      const ids = _.map(data, d => d?.id);
      select[tag] = ids;
    } else {
      select = _.omit(select, [tag]);
    }
    changeCheckData(select);
  };

  /** 点击切换数据 */
  const onChangeTag = (item: any) => {
    if (!item) return setTableData({});
    const tag = item?.tag;
    const initCol = getColumns(item);
    setTableData({ ...item, initCol, tag });
  };

  const onSearch = _.debounce(e => {
    const { value } = e?.target;
    onSearchTag(value);
  }, 300);

  return (
    <div className="searchTableList kw-flex">
      <div className="kw-border-r kw-pr-6" style={{ width: 416 }}>
        <SearchInput
          className="kw-mb-5"
          style={{ width: 392 }}
          placeholder={intl.get('exploreGraph.searchEntityClass')}
          onChange={e => {
            e.persist();
            onSearch(e);
          }}
        />
        {dataList?.result?.length === 0 && (
          <div className="kw-pt-9" style={{ textAlign: 'center' }}>
            <img src={NoResult} />
            <p>{intl.get('global.noResult')}</p>
          </div>
        )}
        {_.map(dataList?.result, (item, index) => {
          const { tag, color, alias, icon } = item;
          const bgSelected = tag === tableData?.tag;
          return (
            <div
              key={index}
              className={classNames('classItem kw-align-center kw-border-b kw-pointer kw-pl-3', {
                'kw-bg-selected': bgSelected
              })}
              style={{ height: 56 }}
              onClick={() => onChangeTag(item)}
            >
              <div className="kw-center" style={{ height: 32, width: 32, borderRadius: '50%', background: color }}>
                <GraphIcon type={icon} className="node-svg" />
              </div>
              <div className="kw-ml-2 kw-ellipsis" style={{ width: 270 }}>
                {alias || tag}
              </div>
            </div>
          );
        })}
        {dataList?.count > 20 && (
          <Pagination
            className="pagination-box kw-pt-4 kw-pr-5"
            current={classPage}
            total={dataList?.count}
            onChange={(page: number) => onPageChange(page)}
            pageSize={20}
            showSizeChanger={false}
            showLessItems={true}
            showTotal={total => intl.get('knowledge.total', { total })}
          />
        )}
      </div>
      <div className="kw-pl-6 kw-pb-6 kw-pr-6" style={{ width: 'calc(100% - 416px)' }}>
        <ResizeTable
          className="result-table"
          initCol={tableData?.initCol}
          dataSource={getTableData(tableData, tableData?.tag)}
          rowSelection={
            isSelectAdd && {
              selectedRowKeys: checkData?.[tableData?.tag],
              fixed: 'left',
              onSelectAll: (selected: any) => {
                onSelectAll(selected, tableData?.vertexs || tableData?.vertexes, tableData?.tag);
              },
              onSelect: (record: any, selected: any) => changeSelectedKeys(record, selected, tableData?.tag),
              getCheckboxProps: (record: any) => {
                if (addedIds.includes(record?.id)) {
                  return { disabled: true };
                }
                return { disabled: false };
              }
            }
          }
          scroll={{ x: '100%' }}
          rowKey={(record: any) => record?.id}
          onRow={() => {
            if (isSelectAdd) {
              return {
                onClick: (e: any) => {
                  e.currentTarget.getElementsByClassName('ant-checkbox-wrapper')[0].click();
                }
              };
            }
            return {};
          }}
          pagination={{
            total: myPagination[tableData?.tag]?.total,
            current: myPagination[tableData?.tag]?.page,
            pageSize: ENTITY_SIZE,
            showTitle: false,
            showSizeChanger: false,
            hideOnSinglePage: true,
            onChange: (page: any) => changeEntitySize(page, tableData?.tag)
          }}
        />
      </div>
    </div>
  );
};
export default TableList;
