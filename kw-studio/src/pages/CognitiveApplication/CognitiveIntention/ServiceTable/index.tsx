/* eslint-disable max-lines */
import React, { useRef, useState, useMemo } from 'react';
import { Table, Button, Dropdown, message, Menu } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType, SorterResult } from 'antd/es/table/interface';
import { LoadingOutlined, DownOutlined, EllipsisOutlined } from '@ant-design/icons';

import intl from 'react-intl-universal';
import moment from 'moment';
import _ from 'lodash';
import classNames from 'classnames';
import HOOKS from '@/hooks';
import HELPER from '@/utils/helper';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';

import { useHistory } from 'react-router-dom';
import ErrorModal from '../ErrorModal';
import ServiceDrawer from '@/components/ServiceDescription';
import { getTextByHtml, copyToBoard, localStore } from '@/utils/handleFunction';

import cognitiveSearchService from '@/services/cognitiveSearch';

import { tipModalFunc, knowModalFunc } from '@/components/TipModal';
import Format from '@/components/Format';
import createImg from '@/assets/images/create.svg';
import noResImg from '@/assets/images/noResult.svg';

import NoDataBox from '@/components/NoDataBox';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import IconFont from '@/components/IconFont';
import ADTable from '@/components/ADTable';
import GraphModal from './graphModal';

import { DESC, ASC, PAGE_SIZE, STATUS_COLOR, STATUS_SHOW, INIT_STATE } from '../enum';
import { ListItem, TableState, kgData } from '../types';
import './style.less';
export interface ServiceTableProps {
  // knData: KnwItem;
  data: ListItem[];
  tableState: TableState;
  onChange: (state: Partial<TableState>) => void;
  onCreate: () => void;
  onEdit?: (data: ListItem, type: string) => void;
  correlateGraph: kgData[];
  isDrawer: boolean;
  setIsDrawer: (state: any) => void;
  onTest: (state: any) => void;
  setAuthData: (data: any) => void;
}

const ServiceTable = (props: ServiceTableProps) => {
  const { data, tableState, onChange, onCreate, onEdit, correlateGraph, onTest, isDrawer, setIsDrawer } = props;
  const { setAuthData } = props;
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const [errorModal, setErrorModal] = useState(false); // 失败详情弹窗
  const { width: widthScreen } = HOOKS.useWindowSize(); // 屏幕宽度
  const [serviceData, setServiceData] = useState<any>(); // 选中的服务信息
  const [sortedInfo, setSortedInfo] = useState<SorterResult<any>>({});
  const [graphModal, setGraphModal] = useState<{ visible: boolean; data: any }>({ visible: false, data: [] }); // 关联图谱弹窗
  const containRef = useRef<any>();

  const userInfo = localStore.get('userInfo');

  const isDataAdmin = _.filter(userInfo?.roles, item => item?.code === 'data_admin')?.length > 0;

  /**
   * 翻页
   */
  const onPageChange = (page: number) => {
    onChange({ page });
  };

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
  const onErrorModal = () => {
    setErrorModal(true);
  };

  const onDescribeMore = (record: any) => {
    setIsDrawer(true);
    setServiceData(record);
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
      render: (text: any, record: any) => {
        return (
          <>
            <div className="kw-ellipsis name-color" title={text}>
              {text}
            </div>
          </>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      fixed: 'left',
      width: 76,
      render: (_: any, record: any) => {
        return (
          <Dropdown
            overlay={() => items(record)}
            trigger={['click']}
            destroyPopupOnHide
            // getPopupContainer={e => e.parentElement?.parentElement?.parentElement || document.body}
          >
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
                <IconFont type="icon-zhuanfa_xiantiao" className="kw-ml-1" />
              </div>
            )}
            {_.includes(method, 'PC_embed') && (
              <div
                className={classNames('kw-pointer kw-align-center api-view kw-c-primary', {
                  'kw-c-watermark': isDataAdmin
                })}
                onClick={() => {
                  if (isDataAdmin) return;
                  const knw_id = record?.resource_knws?.[0]?.knw_id || record?.knw_id;

                  window.open(
                    `/search/iframe-document?service_id=${record.id}&s_name=${record.name}&knw_id=${knw_id}&operation_type=cognitive_search`
                  );
                }}
              >
                {intl.get('cognitiveService.analysis.pcWebEmbed')}
                <IconFont type="icon-zhuanfa_xiantiao" className="kw-ml-1" />
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
          className="kw-align-center kw-pointer serviceIdBox "
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
      title: intl.get('cognitiveSearch.answersOrganization.configError'),
      dataIndex: 'openai_status',
      width: 192,
      ellipsis: true,
      render: (status, record) => {
        const model_type = record.model_type || 'openai';
        // 1.大模型
        // 2.向量模型
        const tip = onModelStatus(record);
        // const tip =
        //   model_type === 'default'
        //     ? '--'
        //     : status
        //     ? '--'
        //     : model_type === 'private_llm'
        //     ? intl.get('cognitiveSearch.answersOrganization.privateLLMError')
        //     : intl.get('cognitiveSearch.answersOrganization.connectionError');
        return <div className="kw-ellipsis">{tip}</div>;
      }
    },
    {
      title: intl.get('cognitiveService.analysis.associated'),
      dataIndex: 'kg_names',
      width: 144,
      ellipsis: true,
      render: (_: any, record: any) => {
        return (
          <div className="kw-ellipsis">
            <span
              className="kw-c-primary kw-pointer kw-mr-1"
              onClick={() => setGraphModal({ visible: true, data: record?.resource_knws })}
            >
              {record?.resource_knws?.[0]?.resource_kgs?.length}
            </span>
            {intl.get('exploreAnalysis.graphNumbers')}
          </div>
        );
      }
    },
    {
      title: intl.get('cognitiveService.analysis.creator'),
      dataIndex: 'creater_email',
      width: 254,
      render: (text, record: any) => {
        return (
          <>
            <div className="kw-ellipsis name-max" title={record.editor_name}>
              {record.editor_name}
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
      dataIndex: 'editor_email',
      width: 254,
      render: (text, record: any) => {
        return (
          <>
            <div className="kw-ellipsis name-max" title={record?.editor_name}>
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

  /**
   * 模型连接状态
   */
  const onModelStatus = (record: any) => {
    const { openai_status, model_type, embed_model_status } = record;
    const isIncludesEmbed = Object.keys(record).includes('embed_model_status');
    const largeModelError =
      model_type === 'private_llm'
        ? intl.get('cognitiveSearch.answersOrganization.privateLLMError')
        : intl.get('cognitiveSearch.answersOrganization.connectionError');
    // 大模型、文本向量模型都连接异常
    if (!openai_status && !embed_model_status && isIncludesEmbed) {
      return `${largeModelError}、${intl.get('cognitiveSearch.answersOrganization.embedError')}`;
    } else if (!embed_model_status && isIncludesEmbed && openai_status) {
      return intl.get('cognitiveSearch.answersOrganization.embedError');
    } else if (!openai_status && (embed_model_status || !isIncludesEmbed)) {
      return largeModelError;
    }
    return '--';
  };

  const items = (record: any) => {
    return (
      <Menu onClick={({ key }) => onOperate(key, record)} style={{ width: 120 }}>
        <Menu.Item
          key={'edit'}
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_APP_COGSEARCH_EDIT,
              userType: PERMISSION_KEYS.SERVICE_EDIT,
              userTypeDepend: record?.__codes
            }) || record.status === 1
          }
        >
          {intl.get('cognitiveService.analysis.edit')}
        </Menu.Item>
        <Menu.Item key={'test'} disabled={isDataAdmin}>
          {intl.get('cognitiveService.analysis.test')}
        </Menu.Item>
        <Menu.Item
          key={record.status === 1 ? 'cancel' : 'publish'}
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_APP_COGSEARCH_EDIT,
              userType: PERMISSION_KEYS.SERVICE_EDIT,
              userTypeDepend: record?.__codes
            })
          }
        >
          {record.status === 1
            ? intl.get('cognitiveService.analysis.unPublish')
            : intl.get('cognitiveService.analysis.publish')}
        </Menu.Item>
        <Menu.Item
          key={'copy'}
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_APP_COGSEARCH_EDIT,
              userType: PERMISSION_KEYS.SERVICE_EDIT,
              userTypeDepend: record?.__codes
            })
          }
        >
          {intl.get('cognitiveSearch.copy')}
        </Menu.Item>
        <Menu.Item
          key={'delete'}
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_APP_COGSEARCH_DELETE,
              userType: PERMISSION_KEYS.SERVICE_DELETE,
              userTypeDepend: record?.__codes
            }) || record.status === 1
          }
        >
          {intl.get('cognitiveService.analysis.delete')}
        </Menu.Item>
        <ContainerIsVisible
          placeholder={<span style={{ height: 32 }} />}
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_APP_COGSEARCH_MEMBER,
            userType: PERMISSION_KEYS.SERVICE_EDIT_PERMISSION,
            userTypeDepend: record?.__codes
          })}
        >
          <Menu.Item onClick={() => setAuthData?.(record)}>{intl.get('graphList.authorityManagement')}</Menu.Item>
        </ContainerIsVisible>
      </Menu>
    );
  };

  const onOperate = async (type: any, record?: any) => {
    let title = '';
    let content = '';
    let isOk: any = false;
    switch (type) {
      case 'api':
        if (isDataAdmin) return;
        window.open(`/cognitive/rest-api?service_id=${record.id}&type=search`);
        break;
      case 'edit':
        onEdit?.(record, 'edit');
        break;
      case 'test':
        onTest(record);
        break;
      case 'copy':
        copyToBoard(record?.name);
        onEdit?.(record, 'copy');
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
      default:
        break;
    }
  };

  const onDeleteCancel = async (isOk: any, type: any, record?: any) => {
    if (!isOk) return;
    try {
      if (type === 'delete') {
        await cognitiveSearchService.deleteSearch({ service_id: record.id });
        message.success(intl.get('cognitiveService.analysis.deleteSuccess'));
        onChange({});
      }
      if (type === 'cancel') {
        await cognitiveSearchService.cancelPublish({ service_id: record.id });
        onChange({});
      }
    } catch (err) {
      const { Description, ErrorCode } = err.response || err.data || {};
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      Description && message.error(Description);
    }
  };

  const isSearching = useMemo(() => {
    const isEqual = _.isEqual(_.omit(tableState, ['count', 'loading']), _.omit(INIT_STATE, ['count', 'loading']));
    return !isEqual;
  }, [tableState]);

  return (
    <div className="analysis-search-service-table-root">
      <div className="main-table" ref={containRef}>
        <ADTable
          showHeader={false}
          className="searchTable"
          dataSource={data}
          lastColWidth={170}
          columns={columns}
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
              <ContainerIsVisible
                placeholder={<div className="kw-c-text">{intl.get('graphList.noContent')}</div>}
                isVisible={HELPER.getAuthorByUserInfo({
                  roleType: PERMISSION_CODES.ADF_APP_COGSEARCH_CREATE,
                  userType: PERMISSION_KEYS.KN_ADD_SERVICE
                  // userTypeDepend: knData?.__codes
                })}
              >
                <span>{intl.get('cognitiveSearch.noService').split('|')[0]}</span>
                <span className="kw-c-primary kw-pointer" onClick={onCreate}>
                  {intl.get('cognitiveSearch.noService').split('|')[1]}
                </span>
                <span>{intl.get('cognitiveSearch.noService').split('|')[2]}</span>
              </ContainerIsVisible>
            )
          }
        />
      </div>
      {/* 错误报告弹框 */}
      <ErrorModal errorModal={errorModal} handleCancel={() => setErrorModal(false)} />
      {/* {isDrawer && <ServiceDrawer setIsDrawer={setIsDrawer} serviceData={serviceData} />} */}
      <GraphModal
        visible={graphModal.visible}
        data={graphModal?.data}
        onCancel={() => setGraphModal({ visible: false, data: [] })}
      />
    </div>
  );
};

export default ServiceTable;
