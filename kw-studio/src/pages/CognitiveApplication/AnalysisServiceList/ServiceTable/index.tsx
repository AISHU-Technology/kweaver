import React, { useState, useEffect, useMemo } from 'react';
import { Dropdown, Menu, message } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType, SorterResult } from 'antd/es/table/interface';
import { LoadingOutlined, EllipsisOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import intl from 'react-intl-universal';
import moment from 'moment';
import _ from 'lodash';
import HOOKS from '@/hooks';
import { useHistory } from 'react-router-dom';
import ErrorModal from '../ErrorModal';
import ServiceDescription from '@/components/ServiceDescription';
import { copyToBoard, getTextByHtml, localStore } from '@/utils/handleFunction';
import Format from '@/components/Format';
import HELPER from '@/utils/helper';

import analysisService from '@/services/analysisService';
import servicesPermission from '@/services/rbacPermission';

import IconFont from '@/components/IconFont';
import { tipModalFunc, knowModalFunc } from '@/components/TipModal';
import KwTable from '@/components/KwTable';
import createImg from '@/assets/images/create.svg';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import { ANALYSIS_SERVICES } from '@/enums';

import { DESC, ASC, PAGE_SIZE, STATUS_COLOR, STATUS_SHOW, INIT_STATE } from '../enum';
import { ListItem, TableState, kgData } from '../types';
import noResImg from '@/assets/images/noResult.svg';

import './style.less';
export interface ServiceTableProps {
  data: ListItem[];
  tableState: TableState;
  onChange: (state: Partial<TableState>) => void;
  onCreate: () => void;
  onEdit?: (data: ListItem, type: string) => void;
  correlateGraph: kgData[];
  isDrawer: boolean;
  setIsDrawer: (state: any) => void;
  setAuthData: (data: any) => void;
}

const ServiceTable = (props: ServiceTableProps) => {
  const { data, tableState, isDrawer } = props;
  const { onChange, onCreate, onEdit, setIsDrawer, setAuthData } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const [errorModal, setErrorModal] = useState(false); // 失败详情弹窗
  const [serviceData, setServiceData] = useState<any>(); // 选中的服务信息
  const [sortedInfo, setSortedInfo] = useState<SorterResult<any>>({});
  const userInfo = localStore.get('userInfo');
  const isDataAdmin = _.filter(userInfo?.roles, item => item?.code === 'data_admin')?.length > 0;

  /**
   * 表格变化回调
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange: TableProps<ListItem>['onChange'] = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const { order, field } = sorter as any;
    setSortedInfo(sorter as SorterResult<any>);
    if (order.slice(0, 3) === 'asc') {
      onChange({ page: 1, order_type: 'asc', order_field: field });
    } else {
      onChange({ page: 1, order_type: 'desc', order_field: field });
    }
  };

  /**
   * 发布失败详情弹窗
   */
  const onErrorModal = () => setErrorModal(true);

  const onDescribeMore = (record: any) => {
    setIsDrawer(true);
    setServiceData(record);
  };

  const onTest = (record: ListItem) => {
    history.push(`/cognitive/test?service_id=${record.id}&operation_type=${record.operation_type}`);
  };

  const columns: ColumnsType<ListItem> = [
    {
      title: intl.get('cognitiveService.analysis.serviceName'),
      dataIndex: 'name',
      key: 'name',
      width: 296,
      sorter: true,
      fixed: 'left',
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
      showSorterTooltip: false,
      render: (text: any) => <div className="kw-ellipsis name-color">{text}</div>
    },
    {
      title: intl.get('global.operation'),
      fixed: 'left',
      width: 76,
      render: (_: any, record: any) => {
        return (
          <Dropdown overlay={() => moreOverlay(record)} trigger={['click']} destroyPopupOnHide>
            <Format.Button onClick={event => event.stopPropagation()} className="kw-table-operate" type="icon">
              <EllipsisOutlined style={{ fontSize: 20 }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get('cognitiveService.analysis.state'),
      dataIndex: 'status',
      width: 120,
      render: (status, record) => {
        return (
          <div className="kw-flex table-status">
            {/* 0-未发布 1-已发布 2-发布失败 */}
            <div className="status-color kw-mr-2" style={{ background: STATUS_COLOR[status] }}></div>
            <span>{STATUS_SHOW[status]}</span>
            {/* 发布失败 查看详情按钮 */}
            {status === 2 && (
              <span className="kw-c-primary kw-pointer kw-ml-3" onClick={onErrorModal}>
                {intl.get('cognitiveService.analysis.details')}
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: intl.get('cognitiveService.analysis.query'),
      dataIndex: 'operation_type',
      ellipsis: true,
      width: 176,
      render: text => {
        return ANALYSIS_SERVICES?.text(text);
      }
    },
    {
      title: intl.get('cognitiveService.analysis.document'),
      dataIndex: 'access_method',
      width: 148,
      render: (method, record) => {
        return (
          <div style={{ height: 40 }} className="apiBox">
            {_.includes(method, 'restAPI') && (
              <div
                className={classNames('kw-pointer kw-align-center api-view kw-c-primary', {
                  'kw-c-watermark': isDataAdmin
                })}
                onClick={() => onOperate('api', record)}
              >
                RESTful API
                <IconFont
                  type="icon-zhuanfa_xiantiao"
                  className="kw-ml-1"
                  style={{ fontSize: '14px', transform: 'translateY(1px)' }}
                />
              </div>
            )}
            {_.includes(method, 'PC_embed') && (
              <div
                className={classNames('kw-pointer kw-align-center api-view1 kw-c-primary', {
                  'kw-c-watermark': isDataAdmin
                })}
                onClick={() => {
                  if (isDataAdmin) return;
                  window.open(
                    `/cognitive/iframe-document?service_id=${record.id}&s_name=${record.name}&operation_type=${record?.operation_type}`
                  );
                }}
              >
                {intl.get('cognitiveService.analysis.pcWebEmbed')}
                <IconFont type="icon-zhuanfa_xiantiao" className="kw-ml-1" style={{ fontSize: '14px' }} />
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: intl.get('cognitiveService.restAPI.serviceId'),
      dataIndex: 'id',
      width: 336,
      render: (text: string) => (
        <div
          className="kw-align-center kw-pointer serviceIdBox"
          onClick={() => {
            copyToBoard(text);
            message.success(intl.get('exploreAnalysis.copySuccess'));
          }}
        >
          {text}
          <IconFont type="icon-copy" className="kw-ml-1 kw-pointer copyIcon" />
        </div>
      )
    },
    {
      title: intl.get('cognitiveService.analysis.associated'),
      width: 192,
      render: (_: any, record: any) => {
        const knwName = record?.resource_knws?.[0]?.name;
        const kgName = record?.resource_knws?.[0]?.resource_kgs?.[0]?.kg_name;
        return <div className="kw-w-100 kw-ellipsis" title={`${kgName}-${knwName}`}>{`${kgName}-${knwName}`}</div>;
      }
    },
    {
      title: intl.get('cognitiveService.analysis.creator'),
      dataIndex: 'creater',
      width: 254,
      render: (text: any, record: any) => {
        return (
          <>
            <div className="kw-ellipsis" title={record?.creater_name}>
              {record?.creater_name}
            </div>
          </>
        );
      }
    },
    {
      title: intl.get('cognitiveService.analysis.createdTime'),
      dataIndex: 'create_time',
      key: 'create_time',
      width: 170,
      ellipsis: true,
      sorter: true,
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sortedInfo.columnKey === 'create_time' ? sortedInfo.order : null,
      showSorterTooltip: false,
      render: time => moment(time * 1000).format('YYYY-MM-DD HH:mm:ss') || '- -'
    },
    {
      title: intl.get('cognitiveService.analysis.finalOperator'),
      dataIndex: 'editor',
      width: 254,
      render: (text: any, record: any) => {
        return (
          <>
            <div className="kw-ellipsis" title={record?.editor_name}>
              {record?.editor_name}
            </div>
          </>
        );
      }
    },
    {
      title: intl.get('cognitiveService.analysis.finalTime'),
      dataIndex: 'edit_time',
      key: 'edit_time',
      width: 170,
      ellipsis: true,
      sorter: true,
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sortedInfo.columnKey === 'edit_time' ? sortedInfo.order : null,
      showSorterTooltip: false,
      render: time => moment(time * 1000).format('YYYY-MM-DD HH:mm:ss') || '- -'
    }
  ];

  const moreOverlay = (record: any) => {
    return (
      <Menu onClick={({ key }) => onOperate(key, record)} style={{ width: 120 }}>
        <Menu.Item disabled={record.status === 1} key="edit">
          {intl.get('cognitiveService.analysis.edit')}
        </Menu.Item>
        <Menu.Item disabled={isDataAdmin} key="test">
          {intl.get('cognitiveService.analysis.test')}
        </Menu.Item>
        <Menu.Item key={`${record.status === 1 ? 'cancel' : 'publish'}`}>
          {record.status === 1
            ? intl.get('cognitiveService.analysis.unPublish')
            : intl.get('cognitiveService.analysis.publish')}
        </Menu.Item>
        <Menu.Item key={'export'}>{intl.get('modelLibrary.export')}</Menu.Item>
        <Menu.Item key={'delete'} disabled={record.status === 1}>
          {intl.get('global.delete')}
        </Menu.Item>
        <ContainerIsVisible placeholder={<span style={{ height: 32 }} />}>
          <Menu.Item onClick={() => setAuthData(record)}>{intl.get('graphList.authorityManagement')}</Menu.Item>
        </ContainerIsVisible>
      </Menu>
    );
  };

  /**
   * 删除 | 取消 | 跳转api | 导出 | 发布 | 权限
   * @param type // delete-删除 cancel-取消 api import-导出 -publish-发布
   * // auth-权限
   */
  const onOperate = async (type: any, record?: any, file?: any) => {
    let title = '';
    let content = '';
    let isOk: any = '';
    let permissionExport = false;
    switch (type) {
      case 'api':
        window.open(`/cognitive/rest-api?service_id=${record.id}&type=analysis`);
        break;
      case 'delete' && record?.id === 1:
        knowModalFunc.open({
          title: intl.get('cognitiveService.analysis.failedDelete'),
          content: intl.get('cognitiveService.analysis.configured')
        });
        break;
      case 'cancel':
        title = intl.get('cognitiveService.analysis.unPublishService');
        content = intl.get('cognitiveService.analysis.unPublishDes');
        isOk = await tipModalFunc({ title, content, closable: false });
        onDeleteCancel(isOk, type, record);
        break;
      case 'delete':
        title = intl.get('cognitiveService.analysis.deleteService');
        content = intl.get('cognitiveService.analysis.retrieved');
        isOk = await tipModalFunc({ title, content, closable: false });
        onDeleteCancel(isOk, type, record);
        break;
      case 'publish':
        onEdit?.(record, 'publish');
        break;
      case 'test':
        onTest(record);
        break;
      case 'edit':
        onEdit?.(record, 'edit');
        break;
      case 'export':
        onGetPermission(record);
        break;
      default:
        break;
    }
  };

  /**
   * 导出时获取权限
   */
  const onGetPermission = (record: any) => {
    const dataIds = [String(record?.id)];
    let codesData: any = {};
    // servicesPermission.dataPermission(postData).then(result => {
    //   codesData = _.keyBy(result?.res, 'dataId');
    //   if (!_.isEmpty(codesData) && !_.includes(codesData?.[record?.id]?.codes, 'SERVICE_EDIT')) {
    //     return message.error(intl.get('license.serAuthError'));
    //   }
    //   onExport(record);
    // });
    onExport(record);
  };

  /**
   * 导出
   */
  const onExport = async (record: any) => {
    try {
      await analysisService.analysisServiceExport(record);
    } catch (err) {
      //
    }
  };

  const onDeleteCancel = async (isOk: any, type: any, record?: any) => {
    if (!isOk) return;
    try {
      if (type === 'delete') {
        await analysisService.analysisServiceDelete({ service_id: record.id });
        message.success(intl.get('cognitiveService.analysis.deleteSuccess'));
        onChange({});
      }
      if (type === 'cancel') {
        await analysisService.analysisServiceCancel({ service_id: record.id });
        onChange({});
      }
    } catch (err) {
      const { Description, ErrorCode } = err.response || err.data || {};
      if (ErrorCode === 'Cognitive.ServicePermissionDeniedErr') return message.error(intl.get('license.serAuthError'));
      Description && message.error(Description);
    }
  };

  /**
   * 翻页
   */
  const onPageChange = (page: number) => {
    onChange({ page });
  };

  /**
   * 取消弹窗
   */
  const onHandleCancel = () => {
    setErrorModal(false);
  };

  const isSearching = useMemo(() => {
    const isEqual = _.isEqual(_.omit(tableState, ['count', 'loading']), _.omit(INIT_STATE, ['count', 'loading']));
    return !isEqual;
  }, [tableState]);

  return (
    <div className="analysis-service-table-root">
      <div className="main-table kw-pt-4">
        <KwTable
          className="serviceTable"
          showHeader={false}
          dataSource={data}
          columns={columns}
          lastColWidth={170}
          rowKey="id"
          tableLayout="fixed"
          scroll={{ x: '100%' }}
          onChange={onTableChange}
          pagination={{
            current: tableState.page,
            total: tableState.count,
            pageSize: PAGE_SIZE,
            onChange: onPageChange,
            className: 'data-table-pagination',
            showTitle: false,
            showSizeChanger: false
          }}
          loading={
            tableState.loading && {
              indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
            }
          }
          emptyImage={isSearching ? noResImg : createImg}
          emptyText={
            isSearching ? (
              intl.get('global.noResult')
            ) : (
              <ContainerIsVisible placeholder={<div className="kw-c-text">{intl.get('graphList.noContent')}</div>}>
                <span>{intl.get('cognitiveService.analysis.noService').split('|')[0]}</span>
                <span className="kw-c-primary kw-pointer" onClick={onCreate}>
                  {intl.get('cognitiveService.analysis.noService').split('|')[1]}
                </span>
                <span>{intl.get('cognitiveService.analysis.noService').split('|')[2]}</span>
              </ContainerIsVisible>
            )
          }
        />
      </div>
      {/* 错误报告弹框 */}
      <ErrorModal errorModal={errorModal} handleCancel={() => setErrorModal(false)} />
      {/* {isDrawer && <ServiceDescription setIsDrawer={setIsDrawer} serviceData={serviceData} />} */}
      <ErrorModal errorModal={errorModal} onHandleCancel={onHandleCancel} />
    </div>
  );
};

export default ServiceTable;
