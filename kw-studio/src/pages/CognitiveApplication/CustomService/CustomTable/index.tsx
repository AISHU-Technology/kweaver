import React, { useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Menu, Dropdown, message } from 'antd';
import { EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';
import intl from 'react-intl-universal';
import _ from 'lodash';
import HOOKS from '@/hooks';
import { useHistory } from 'react-router-dom';
import IconFont from '@/components/IconFont';
import Format from '@/components/Format';
import classNames from 'classnames';
import moment from 'moment';
import type { TableProps } from 'antd';
import { tipModalFunc, knowModalFunc } from '@/components/TipModal';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import HELPER from '@/utils/helper';
import { PERMISSION_KEYS, PERMISSION_CODES } from '@/enums';
import ServiceDescription from '@/components/ServiceDescription';
import { getTextByHtml, copyToBoard, localStore } from '@/utils/handleFunction';
import customService from '@/services/customService';
import ADTable from '@/components/ADTable';
import createImg from '@/assets/images/create.svg';
import noResImg from '@/assets/images/noResult.svg';

import ErrorModal from '../ErrorModal';
import RelevanceModal from './RelevanceModal';

import { DESC, ASC, PAGE_SIZE, STATUS_COLOR, STATUS_SHOW, INIT_STATE, SORTER_MAP } from '../enum';
import { ListItem } from '../types';
import './style.less';
import { EnvOptions } from '../constants';

const sorter2sorter = (key: string) => SORTER_MAP[key] || key;
const CustomTable = (props: any, ref: any) => {
  const { tableData, tableState, sorter, setSorter, onChange, onEdit, onSetAuthData, onShowModal } = props;
  const language = HOOKS.useLanguage();
  const history = useHistory();
  const containRef = useRef<any>();
  const [errorModal, setErrorModal] = useState(false); // 失败详情弹窗
  const [relevanceModal, setRelevanceModal] = useState(false); // 关联图谱弹窗
  const [relevanceList, setRelevanceList] = useState(false); // 关联图谱
  const [isDrawer, setIsDrawer] = useState(false); // 描述弹窗
  const [serviceData, setServiceData] = useState<any>({}); // 表格行信息
  const userInfo = localStore.get('userInfo');
  const isDataAdmin = _.filter(userInfo?.roles, item => item?.code === 'data_admin')?.length > 0;

  useImperativeHandle(ref, () => ({ onChangeSorter }));

  const getKgNumbers = (data: any) => {
    if (_.isEmpty(data)) return 0;
    const kgs = _.reduce(data, (acc: number, curr: any) => acc + curr?.resource_kgs?.length, 0);
    return kgs;
  };
  const columns: any = [
    {
      title: intl.get('cognitiveService.analysis.serviceName'),
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 296,
      sorter: true,
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sorter.rule === 'name' && sorter2sorter(sorter.order),
      showSorterTooltip: false,
      render: (text: any, record: any) => {
        return <div className="kw-ellipsis name-color">{text}</div>;
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
      render: (status: any, record: any) => {
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
      render: (method: any, record: any) => {
        return (
          <React.Fragment>
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
          </React.Fragment>
        );
      }
    },
    {
      title: intl.get('customService.ID'),
      dataIndex: 'id',
      width: 296,
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
      title: intl.get('customService.env'),
      dataIndex: 'env',
      width: 224,
      ellipsis: true,
      render: (text: any) => {
        return <div>{EnvOptions.find(item => item.value === text)?.label}</div>;
      }
    },
    {
      title: intl.get('cognitiveService.analysis.associated'),
      dataIndex: 'resource_knws',
      width: 144,
      ellipsis: true,
      render: (_: any, record: any) => {
        return (
          <div className="kw-pointer kw-flex">
            <div className="kw-c-primary" onClick={() => onRelevanceGraph(record?.resource_knws)}>
              {getKgNumbers(record?.resource_knws)}
            </div>
            {intl.get('customService.graphs')}
          </div>
        );
      }
    },
    // {
    //   title: intl.get('cognitiveService.analysis.description'),
    //   dataIndex: 'description',
    //   width: 278,
    //   render: (text: any, record: any) => (
    //     <div className="kw-flex custom-description">
    //       {text ? (
    //         <div className="kw-ellipsis text-show kw-pointer" onClick={() => onOpenDescription(record)}>
    //           {getTextByHtml(text).replace(/&nbsp;/g, '')}
    //         </div>
    //       ) : (
    //         <span className="text-color">{intl.get('cognitiveService.analysis.noDescription')}</span>
    //       )}
    //     </div>
    //   )
    // },
    {
      title: intl.get('cognitiveService.analysis.creator'),
      dataIndex: 'creater_email',
      width: 254,
      render: (text: any, record: any) => {
        return <div title={record.creater_name}>{record.creater_name}</div>;
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
      sortOrder: sorter.rule === 'create_time' && sorter2sorter(sorter.order),
      showSorterTooltip: false,
      render: (time: any) => moment(time * 1000).format('YYYY-MM-DD HH:mm:ss') || '- -'
    },
    {
      title: intl.get('cognitiveService.analysis.finalOperator'),
      dataIndex: 'editor_email',
      width: 254,
      render: (text: any, record: any) => {
        return <div title={record?.editor_name}>{record?.editor_name}</div>;
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
      sortOrder: sorter.rule === 'edit_time' && sorter2sorter(sorter.order),
      showSorterTooltip: false,
      render: (time: any) => moment(time * 1000).format('YYYY-MM-DD HH:mm:ss') || '- -'
    }
  ];

  /**
   * 测试
   */
  const onTest = (record: ListItem) => {
    history.push(`/custom/test?action=test&s_id=${record?.id}`);
  };

  /**
   * 打开描述
   */
  const onOpenDescription = (record?: any) => {
    record.edit_time = moment(record?.edit_time * 1000).format('YYYY-MM-DD HH:mm:ss');
    setServiceData(record);
    setIsDrawer(true);
  };

  /**
   * 关联图谱数量
   */
  const onRelevanceGraph = (text: any) => {
    setRelevanceList(text);
    setRelevanceModal(true);
  };

  /**
   * 发布失败详情弹窗
   */
  const onErrorModal = () => {
    setErrorModal(true);
  };

  const onOperate = async (type: any, record?: any) => {
    let title = '';
    let content = '';
    let isOk: any = false;
    switch (type) {
      case 'api':
        if (isDataAdmin) return;
        window.open(`/cognitive/rest-api?service_id=${record.id}&type=custom`);
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
        await customService.deleteCustomPublish({ service_id: record.id });
        message.success(intl.get('cognitiveService.analysis.deleteSuccess'));
        onChange({});
      }
      if (type === 'cancel') {
        await customService.cancelCustomPublish({ service_id: record.id });
        onChange({});
      }
    } catch (err) {
      // if (!err.type) return;
      const { Description, ErrorCode } = err.response || err.data || {};
      if (ErrorCode === 'KnCognition.ServicePermissionDeniedErr') {
        return message.error(intl.get('license.serAuthError'));
      }
      Description && message.error(Description);
    }
  };

  const items = (record: any) => {
    return (
      <Menu onClick={({ key }) => onOperate(key, record)} style={{ width: 120 }}>
        <Menu.Item
          key="edit"
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_APP_CUSTOM_EDIT,
              userType: PERMISSION_KEYS.SERVICE_EDIT,
              userTypeDepend: record?.__codes
            }) || record.status === 1
          }
        >
          {intl.get('cognitiveService.analysis.edit')}
        </Menu.Item>
        <Menu.Item disabled={isDataAdmin} key="test">
          {intl.get('cognitiveService.analysis.test')}
        </Menu.Item>
        <Menu.Item
          key={record.status === 1 ? 'cancel' : 'publish'}
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_APP_CUSTOM_EDIT,
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
              roleType: PERMISSION_CODES.ADF_APP_CUSTOM_EDIT,
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
              roleType: PERMISSION_CODES.ADF_APP_CUSTOM_DELETE,
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
            roleType: PERMISSION_CODES.ADF_APP_CUSTOM_MEMBER,
            userType: PERMISSION_KEYS.SERVICE_EDIT_PERMISSION,
            userTypeDepend: record?.__codes
          })}
        >
          <Menu.Item onClick={() => onSetAuthData?.(record)}>{intl.get('graphList.authorityManagement')}</Menu.Item>
        </ContainerIsVisible>
      </Menu>
    );
  };

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
    const order = sorter2sorter(sorter.order);
    const rule = sorter2sorter(sorter.field);
    setSorter({ rule, order });
    if (order.slice(0, 3) === 'asc') {
      onChange({ page: 1, order_type: 'asc', order_field: rule });
    } else {
      onChange({ page: 1, order_type: 'desc', order_field: rule });
    }
  };

  /**
   * 按钮点击排序同时更新表格的排序
   */
  const onChangeSorter = (state: any) => {
    const { order_field, order_type } = state;
    setSorter({ rule: order_field, order: order_type === 'desc' ? 'descend' : 'ascend' });
  };

  /**
   * 新建
   */
  const onCreate = () => {
    onShowModal(true);
    // history.push('/custom/service?action=create');
  };

  const isSearching = useMemo(() => {
    const isEqual = _.isEqual(_.omit(tableState, ['count', 'loading']), _.omit(INIT_STATE, ['count', 'loading']));
    return !isEqual;
  }, [tableState]);

  return (
    <div className="custom-config-service-table-root">
      <div className="main-table kw-pt-4" ref={containRef}>
        <ADTable
          showHeader={false}
          className="searchTable"
          dataSource={tableData}
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
                  roleType: PERMISSION_CODES.ADF_APP_CUSTOM_CREATE,
                  userType: PERMISSION_KEYS.KN_ADD_SERVICE
                })}
              >
                <span>{intl.get('customService.noService').split('|')[0]}</span>
                <span className="kw-c-primary kw-pointer" onClick={onCreate}>
                  {intl.get('customService.noService').split('|')[1]}
                </span>
                <span>{intl.get('customService.noService').split('|')[2]}</span>
              </ContainerIsVisible>
            )
          }
        />
      </div>
      {/* 错误报告弹框 */}
      <RelevanceModal visible={relevanceModal} relevanceList={relevanceList} setRelevanceModal={setRelevanceModal} />
      {/* <ErrorModal errorModal={errorModal} handleCancel={() => setErrorModal(false)} /> */}
      {isDrawer && <ServiceDescription setIsDrawer={setIsDrawer} serviceData={serviceData} />}
    </div>
  );
};

export default forwardRef(CustomTable);
