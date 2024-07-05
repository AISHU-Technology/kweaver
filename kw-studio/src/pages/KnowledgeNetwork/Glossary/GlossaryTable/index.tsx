import React, { useMemo } from 'react';
import { Dropdown, Menu } from 'antd';
import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';
import _ from 'lodash';
import intl from 'react-intl-universal';
import ContainerIsVisible from '@/components/ContainerIsVisible';

import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/create.svg';
import './style.less';
import PaginationCommon from '@/components/PaginationCommon';
import { languageOptions } from '@/pages/KnowledgeNetwork/Glossary/constants';
import { useGlossaryStore } from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';
import KwTable from '@/components/KwTable';
import Format from '@/components/Format';

const GlossaryTable = (props: any) => {
  const { setGlossaryStore } = useGlossaryStore();
  const prefixLocale = 'glossary';
  const {
    tableProps,
    pagination,
    onRowChecked,
    onSortChange,
    openCreateModal,
    openDeleteModal,
    openDetailPage,
    onChangePagination
  } = props;
  const { count } = pagination;
  const prefixCls = 'glossary-table';

  /** 获取排序规则 */
  const getSortOrder = (orderField: string) => {
    if (tableProps.orderField !== orderField) return null;
    return tableProps.order === 'asc' ? 'ascend' : 'descend';
  };

  /** 点击行 */
  const onClickRow = (record: any) => {
    const { selectedRowKeys, selectedRows } = tableProps;
    const keys = _.includes(selectedRowKeys, record?.id)
      ? _.filter(selectedRowKeys, k => k !== record?.id)
      : [record?.id, ...selectedRowKeys];
    const rows: any = _.cloneDeep(selectedRows);
    const index = selectedRows.findIndex((item: any) => item.id === record?.id);
    if (index !== -1) {
      rows.splice(index, 1);
    } else {
      rows.push(record);
    }
    onRowChecked?.(keys, rows);
  };

  // 点击表头排序
  const sortOrderChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorter.order === 'ascend' ? 'asc' : 'desc';
    const rule = sorter.field;
    onSortChange({ orderField: rule, order });
  };

  /**
   * 跳转至详情页
   */
  const jumpDetailPage = (mode: 'view' | 'edit', record: any) => {
    openDetailPage();
    setGlossaryStore(preStore => ({
      ...preStore,
      glossaryData: record,
      mode,
      selectedLanguage: record.default_language
    }));
  };

  const columns: any = [
    {
      title: intl.get(`${prefixLocale}.glossaryName`),
      dataIndex: 'name',
      fixed: true,
      width: 296,
      sorter: true,
      sortOrder: getSortOrder('name'),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (text: string, record: any) => {
        return (
          <div>
            <div
              className="kw-ellipsis kw-c-text-link kw-pointer"
              title={text}
              onClick={e => {
                e.stopPropagation();
                jumpDetailPage('view', record);
              }}
            >
              {text}
            </div>

            <div
              style={{ fontSize: 12 }}
              className="kw-ellipsis kw-c-subtext kw-pointer kw-c-watermark"
              title={record?.description}
              onClick={e => {
                e.stopPropagation();
                jumpDetailPage('view', record);
              }}
            >
              {record?.description || intl.get('global.notDes')}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'operate',
      fixed: true,
      width: 76,
      render: (value: any, record: any) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    jumpDetailPage('view', record);
                  }}
                  key="view"
                >
                  {intl.get('global.view')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    jumpDetailPage('edit', record);
                  }}
                  key="edit"
                >
                  {intl.get('global.edit')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    openDeleteModal([record]);
                  }}
                  key="delete"
                >
                  {intl.get('global.delete')}
                </Menu.Item>
                {/* 
                  <Menu.Item
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      openAuthPage(record);
                    }}
                    key="authorityManagement"
                  >
                    {intl.get('adminManagement.authorityManagement')}
                  </Menu.Item>
                 */}
              </Menu>
            }
          >
            <Format.Button onClick={event => event.stopPropagation()} className="kw-table-operate" type="icon">
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get(`${prefixLocale}.defaultLanguage`),
      dataIndex: 'default_language',
      ellipsis: true,
      // width: 144,
      render: (value: string) => {
        const target = languageOptions.find(item => item.value === value);
        if (target) {
          return target.label;
        }
      }
    },
    {
      title: intl.get(`${prefixLocale}.glossaryCount`),
      dataIndex: 'word_num',
      ellipsis: true,
      // width: 144,
      render: (value: any) => {
        return value ?? 0;
      }
    },
    {
      title: intl.get('global.creator'),
      dataIndex: 'create_user_name',
      ellipsis: true
      // width: 144
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'create_time',
      ellipsis: true,
      // width: 220,
      sorter: true,
      sortOrder: getSortOrder('create_time'),
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'update_user_name',
      ellipsis: true
      // width: 150
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      ellipsis: true,
      // width: 220,
      sorter: true,
      sortOrder: getSortOrder('update_time'),
      sortDirections: ['ascend', 'descend', 'ascend']
    }
  ];

  const createTip = useMemo(() => {
    return intl.get(`${prefixLocale}.createTip`).split('|');
  }, []);

  return (
    <div className={prefixCls}>
      <KwTable
        lastColWidth={170}
        showHeader={false}
        loading={
          tableProps.loading
            ? {
                indicator: <LoadingOutlined className="icon" style={{ fontSize: 24, top: '200px' }} spin />
              }
            : false
        }
        dataSource={tableProps.dataSource}
        columns={columns}
        rowKey="id"
        // scroll={{ x: 'max-content', y: 640 }}
        pagination={false}
        onChange={sortOrderChange}
        rowSelection={{
          fixed: true,
          type: 'checkbox',
          selectedRowKeys: tableProps.selectedRowKeys,
          onChange: (selectedRowKeys, selectedRows) => {
            onRowChecked(selectedRowKeys, selectedRows);
          }
        }}
        onRow={(record: any) => {
          return {
            onClick: () => onClickRow(record)
          };
        }}
        emptyImage={!tableProps.searchValue ? emptyImg : noResImg}
        emptyText={
          !tableProps.searchValue ? (
            <ContainerIsVisible placeholder={<div className="kw-c-text">{intl.get('global.noContent')}</div>}>
              <div>
                {createTip[0]}
                <span className="kw-c-primary kw-pointer" onClick={() => openCreateModal()}>
                  {createTip[1]}
                </span>
                {createTip[2]}
              </div>
            </ContainerIsVisible>
          ) : (
            intl.get('global.noResult')
          )
        }
      />
      <PaginationCommon
        isHide={count === 0}
        className="kw-pt-5"
        paginationData={pagination}
        onChange={onChangePagination}
      />
    </div>
  );
};
export default GlossaryTable;
