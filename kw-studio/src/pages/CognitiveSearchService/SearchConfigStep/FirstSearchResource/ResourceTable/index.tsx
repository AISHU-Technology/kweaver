import React, { useEffect, useState, useImperativeHandle, forwardRef } from 'react';

import _ from 'lodash';
import moment from 'moment';
import classNames from 'classnames';
import intl from 'react-intl-universal';
import { LoadingOutlined } from '@ant-design/icons';
import { Menu, message, Dropdown, Tooltip } from 'antd';

import HOOKS from '@/hooks';
import { PERMISSION_KEYS } from '@/enums';
import ADTable from '@/components/ADTable';
import IconFont from '@/components/IconFont';
import createImg from '@/assets/images/create.svg';
import noResImg from '@/assets/images/noResult.svg';
import { MODEL_TYPE_TRANSLATE } from '../../../enum';

import servicesPermission from '@/services/rbacPermission';

import { SORTER_MAP } from '../../enum';
import { SOURCE_TYPE_ICON, SOURCE_TYPE_ICON_COLOR, SOURCE_TYPE_BORDER_COLOR } from './enum';

import './style.less';

const PAGE_SIZE = 10;
const MODEL_SOURCE_TRANSLATE: Record<string, string> = {
  openai: intl.get('cognitiveSearch.largeModel'),
  private_llm: intl.get('cognitiveSearch.largeModel'),
  embbeding_model: intl.get('cognitiveSearch.resource.vectorModel')
};

const sorter2sorter = (key: string) => SORTER_MAP[key] || key;
const ResourceTable: React.ForwardRefRenderFunction<any, any> = (
  {
    tableData,
    onDelete,
    onCreateEdit,
    onChangeTable,
    tableState,
    setDeleteIds,
    setOperationType,
    testData,
    selectedRowKeys,
    setSelectedRows,
    setSelectedRowKeys,
    setIsAddModal,
    onOpenExternalModel,
    onOpenPrivateModel,
    qaError,
    emError
  },
  ref
) => {
  const [sorter, setSorter] = useState({ rule: 'create_time', order: 'descend' });
  // const [authData, setAuthData] = useState<any>([]); // 有权限的id
  const [dataSource, setDataSource] = useState<any>([]); // 校验过权限的数据
  const { height: screenHeight } = HOOKS.useWindowSize();

  useImperativeHandle(ref, () => ({ onChangeSorter }));

  useEffect(() => {
    if (_.isEmpty(tableData)) {
      setDataSource(tableData);
      return;
    }

    // 查询权限
    const dataIds = _.map(tableData, item => String(item?.kg_id));
    const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds };
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newGraphData = _.filter(tableData, item => {
    //     const hasAuth = _.includes(codesData?.[item?.kg_id]?.codes, 'KG_VIEW');

    //     return hasAuth;
    //   });
    //   const Ids = _.map(newGraphData, item => item.kg_id);
    //   const addAuth = _.map(tableData, item => ({
    //     ...item,
    //     hasAuth: _.includes(Ids, item?.kg_id) || item?.resource_type === 'model'
    //   }));
    //   setDataSource(addAuth);
    //   const noAuth = _.filter(tableData, item => !_.includes(Ids, item?.kg_id) && item?.resource_type === 'kg');
    //   if (!_.isEmpty(noAuth)) message.error(intl.get('global.graphNoPeromission'));
    // });
    setDataSource(tableData);
  }, [tableData]);

  const columns: any = [
    {
      title: intl.get('cognitiveSearch.resource.name'),
      key: 'kg_name',
      dataIndex: 'kg_name',
      width: 244,
      sorter: true,
      sortOrder: sorter.rule === 'kg_name' && sorter2sorter(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      fixed: 'left',
      showSorterTooltip: false,
      render: (text: any, record: any) => {
        const resourceName =
          text ||
          (['openai', 'private_llm'].includes(record?.sub_type)
            ? MODEL_TYPE_TRANSLATE[record?.sub_type]
            : intl.get('cognitiveSearch.resource.embeddingModelName', { device: record?.model_conf?.device }));
        return (
          <div className="kw-ellipsis intention-name" title={resourceName}>
            {resourceName}
            {qaError === record?.sub_type && (
              <Tooltip placement="top" title={intl.get('cognitiveSearch.answersOrganization.connectErrorTwo')}>
                <IconFont className="kw-ml-2" type="icon-Warning" style={{ color: '#F5222D' }} />
              </Tooltip>
            )}
            {!emError && record?.sub_type === 'embbeding_model' && (
              <Tooltip placement="top" title={intl.get('cognitiveSearch.answersOrganization.connectErrorTwo')}>
                <IconFont className="kw-ml-2" type="icon-Warning" style={{ color: '#F5222D' }} />
              </Tooltip>
            )}
          </div>
        );
      }
    },
    {
      title: intl.get('cognitiveSearch.resource.resourceType'),
      key: 'resource_type',
      dataIndex: 'resource_type',
      width: 176,
      render: (text: any, record: any) => {
        const sourceType = MODEL_SOURCE_TRANSLATE[record?.sub_type] || intl.get('cognitiveSearch.resource.know');
        return (
          <div className="kw-flex">
            <div
              className="icon-border-box kw-mr-2 kw-center"
              style={{
                background: SOURCE_TYPE_ICON_COLOR[record?.sub_type || text],
                border: `1px solid ${SOURCE_TYPE_BORDER_COLOR[record?.sub_type || text]}`
              }}
            >
              <IconFont type={SOURCE_TYPE_ICON[record?.sub_type || text]} />
            </div>
            <div className="kw-ellipsis intention-name" title={sourceType}>
              {sourceType}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('cognitiveSearch.resource.description'),
      key: 'description',
      dataIndex: 'description',
      width: 256,
      render: (text: any, record: any) => (
        <div
          className={`kw-ellipsis intention-name ${(text === 'undefined' || !text) && 'text-color'}`}
          title={text === 'undefined' || !text ? intl.get('cognitiveService.analysis.noDescription') : text}
        >
          {text === 'undefined' || !text ? intl.get('cognitiveService.analysis.noDescription') : text}
        </div>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.creator'),
      dataIndex: 'creater_name',
      width: 204,
      render: (text: any, record: any) => (
        <>
          <div title={text} className="creator-style kw-ellipsis">
            {text || '--'}
          </div>
        </>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.createTime'),
      key: 'create_time',
      dataIndex: 'create_time',
      width: 214,
      sorter: true,
      sortOrder: sorter.rule === 'create_time' && sorter2sorter(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      showSorterTooltip: false,
      render: (text: any, record: any) => moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') || '--'
    },
    {
      title: intl.get('cognitiveSearch.resource.final'),
      dataIndex: 'editor_name',
      width: 204,
      render: (text: any, record: any) => (
        <>
          <div title={text} className="creator-style kw-ellipsis">
            {text || '--'}
          </div>
        </>
      )
    },
    {
      title: intl.get('cognitiveSearch.resource.finalTime'),
      key: 'edit_time',
      dataIndex: 'edit_time',
      width: 258,
      sorter: true,
      sortOrder: sorter.rule === 'edit_time' && sorter2sorter(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      showSorterTooltip: false,
      render: (text: any, record: any) => moment(parseInt(text)).format('YYYY-MM-DD HH:mm:ss') || '--'
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'op',
      width: 212,
      fixed: 'right',
      render: (_: any, record: any) => {
        return (
          <div className="kw-flex">
            <span
              className={classNames('kw-mr-8 kw-c-primary op-btn kw-pointer', {
                'kw-c-watermark': !record?.hasAuth
              })}
              onClick={() => {
                if (record?.hasAuth) onCreateEdit(record);
              }}
            >
              {intl.get('cognitiveSearch.edit')}
            </span>
            <span className="kw-mr-8 kw-c-primary op-btn kw-pointer" onClick={() => onDelete(record, 'single')}>
              {intl.get('cognitiveSearch.deleteTwo')}
            </span>
          </div>
        );
      }
    }
  ];

  const rowSelection: any = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onChange: (selectedRowKeys: any, selectedRows: any) => {
      setSelectedRowKeys(selectedRowKeys);
      setSelectedRows(selectedRows);
      const deleteIds = selectedRowKeys.join(',').split(',');
      setDeleteIds(deleteIds);
    },
    preserveSelectedRowKeys: false
  };

  /**
   * 按钮点击排序同时更新表格的排序
   */
  const onChangeSorter = (state: any) => {
    const { rule, order } = state;
    setSorter({ rule, order });
  };

  /**
   * 表格变化
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorter2sorter(sorter.order);
    const rule = sorter2sorter(sorter.field);
    setSorter({ rule, order });
    if (order === 'ascend') {
      onChangeTable({ order: 'ascend', rule }, testData);
    } else {
      onChangeTable({ order: 'descend', rule }, testData);
    }
  };

  /**
   * 翻页
   */
  const onPageChange = (page: number) => {
    onChangeTable({ page }, testData);
  };

  const onCreate = (type: string) => {
    setOperationType(type);
    setIsAddModal(true);
  };

  const createMenu = () => {
    return (
      <Menu>
        <Menu.Item
          onClick={() => {
            setOperationType('create');
            setIsAddModal(true);
          }}
        >
          {intl.get('cognitiveSearch.resource.know')}
        </Menu.Item>
        <Menu.Item onClick={() => onOpenExternalModel()}>{intl.get('cognitiveSearch.resource.vectorModel')}</Menu.Item>
        <Menu.Item onClick={() => onOpenPrivateModel()}>{intl.get('cognitiveSearch.largeModel')}</Menu.Item>
      </Menu>
    );
  };

  return (
    <div className="source-graph-table-wrap">
      <ADTable
        className="search-table kw-mt-6"
        showHeader={false}
        columns={columns}
        lastColWidth={170}
        dataSource={dataSource}
        onChange={onTableChange}
        rowSelection={rowSelection}
        pagination={{
          total: tableState.count,
          current: tableState.page,
          pageSize: PAGE_SIZE,
          onChange: onPageChange,
          className: 'data-table-pagination',
          showTitle: false,
          showSizeChanger: false
        }}
        rowKey={record => record?.kg_id || record?.model_name}
        tableLayout="fixed"
        // style={{ height: 'calc(100% - 300px)' }}
        scroll={{ x: '100%', y: screenHeight - 413 }}
        loading={
          tableState.loading && {
            indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
          }
        }
        rowClassName={record =>
          classNames({ noAuthRow: !record?.hasAuth }, { selectRow: selectedRowKeys.includes(record?.kg_id) })
        }
        emptyImage={tableState.name || tableState?.type !== 'all' ? noResImg : createImg}
        emptyText={
          tableState.name ? (
            intl.get('global.noResult')
          ) : (
            <div>
              <span>{intl.get('cognitiveSearch.resource.noData').split('|')[0]}</span>
              <Dropdown overlay={createMenu} trigger={['hover']}>
                <span className="kw-c-primary kw-pointer">
                  {intl.get('cognitiveSearch.resource.noData').split('|')[1]}
                </span>
              </Dropdown>
              <span>{intl.get('cognitiveSearch.resource.noData').split('|')[2]}</span>
            </div>
          )
        }
      />
    </div>
  );
};

export default forwardRef(ResourceTable);
