import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import moment from 'moment';
import classnames from 'classnames';
import intl from 'react-intl-universal';

import { Button, Dropdown, Menu, Table, message } from 'antd';
import type { ColumnsType, SorterResult } from 'antd/es/table/interface';
import { LoadingOutlined, DownOutlined, EllipsisOutlined } from '@ant-design/icons';

import HELPER from '@/utils/helper';
import { PERMISSION_CODES } from '@/enums';
import createImg from '@/assets/images/create.svg';
import { getParam } from '@/utils/handleFunction';
import intentionService from '@/services/intention';

import { ITable } from '@/components/ADTable';
import Format from '@/components/Format';
import NoDataBox from '@/components/NoDataBox';
import { tipModalFunc, knowModalFunc } from '@/components/TipModal';
import TestIntentionModal from '../TestIntentionModal';
import ErrorModal from '../ErrorModal';
import { STATUS_COLOR, OPERATION_STYLE, STATUS_NAME } from '../enum';
import { TableType } from '../types';

import './style.less';

const PAGE_SIZE = 10;
const ASC = 'ascend';
const DESC = 'descend';

const IntentionTable = (props: any) => {
  const { tableData, onChangeTable, onCreateEdit, tableState } = props;
  const [sortedInfo, setSortedInfo] = useState<SorterResult<any>>({});
  const [isTestModal, setIsTestModal] = useState(false);
  const [isErrorModal, setIsErrorModal] = useState(false); // 失败详情弹窗
  const [testId, setTestId] = useState<any>('');
  const [arrowDirection, setArrowDirection] = useState(false); // 箭头的方向 false-向下 true-向上
  const [intentionId, setIntentionId] = useState(0);
  const [errorDes, setErrorDes] = useState(''); // 错误详情
  const [testSuccess, setTestSuccess] = useState(false);
  const [isAgain, setIsAgain] = useState(0);

  useEffect(() => {
    if (isAgain >= 2) return;
    if (isAgain === 1) {
      onTest({ intentpool_id: testId }, 'again');
    }
  }, [isAgain]);

  /**
   * 导出报告
   */
  const onExport = async (record: any) => {
    setArrowDirection(false);
    try {
      await intentionService.exportResult(
        {
          intentpool_id: record?.intentpool_id
        },
        record
      );
    } catch (err) {
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  /**
   * 下载模型
   */
  const onDownLoad = async (record: any) => {
    setArrowDirection(false);
    try {
      await intentionService.downLoadModel(
        {
          intentpool_id: record?.intentpool_id
        },
        record
      );
    } catch (err) {
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  /**
   * 删除
   */
  const onDelete = async (intent_id: any) => {
    setArrowDirection(false);
    const isOk = await tipModalFunc({
      title: intl.get('intention.deleteIntent'),
      content: intl.get('intention.retried')
    });
    if (!isOk) return;
    try {
      const deleteIntent = await intentionService.deleteIntentPool({ intentpool_id: intent_id });
      if (deleteIntent) {
        message.success(intl.get('cognitiveService.analysis.deleteSuccess'));
        onChangeTable({});
      }
    } catch (err) {
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  /**
   * 错误详情
   */
  const errorDetail = (record: any) => {
    setIsErrorModal(true);
    setErrorDes(record?.train_info);
    setTestId(record?.intentpool_id);
  };

  /**
   * 训练
   */
  const onTrain = async (record: any) => {
    try {
      const res = await intentionService.trainModel({ intentpool_id: record?.intentpool_id });
      if (res) {
        onChangeTable({});
        message.success(intl.get('intention.added'));
      }
    } catch (error) {
      if (
        error?.ErrorDetails &&
        error?.ErrorDetails[0].detail === 'A task is training,please wait for completion before starting'
      ) {
        knowModalFunc.open({
          title: intl.get('intention.operateFail'),
          content: intl.get('intention.taskTip')
        });
      }
    }
  };

  /**
   * 表格行标题
   */
  const columns: ColumnsType<TableType> = [
    {
      title: intl.get('intention.poolName'),
      key: 'intentpool_name',
      fixed: 'left',
      dataIndex: 'intentpool_name',
      width: 296,
      sorter: true,
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sortedInfo.columnKey === 'intentpool_name' ? sortedInfo.order : null,
      showSorterTooltip: false,
      render: (text: any, record: any) => (
        <>
          <div className="kw-ellipsis intention-name" title={text}>
            {text}
          </div>
          <div
            className={classnames('kw-ellipsis intention-name description-color', {
              'kw-c-watermark': !record.description
            })}
            title={record?.description || intl.get('cognitiveService.analysis.noDescription')}
          >
            {record.description || intl.get('cognitiveService.analysis.noDescription')}
          </div>
        </>
      )
    },
    {
      title: intl.get('intention.operate'),
      dataIndex: 'op',
      width: 76,
      key: 'action',
      fixed: 'left',
      render: (_: any, record: any) => {
        return (
          <Dropdown overlay={menu(record)} trigger={['click']} placement="bottomLeft">
            <Format.Button className="kw-table-operate" type="icon">
              <EllipsisOutlined style={{ color: 'rgba(0, 0, 0, 0.85)', fontSize: '16px' }} />
            </Format.Button>
          </Dropdown>
        );
      }
    },
    {
      title: intl.get('intention.trainState'),
      key: 'train_status',
      dataIndex: 'train_status',
      // width: 208,
      render: (status: any, record: any) => (
        <div className="kw-flex status-box">
          <div className="status-color kw-mr-2" style={{ background: STATUS_COLOR[status] }}></div>
          <div className="kw-ellipsis intention-name">{STATUS_NAME[status]}</div>
          {status === '训练失败' && (
            <div className="kw-ml-3 kw-c-primary kw-pointer" onClick={() => errorDetail(record)}>
              {intl.get('intention.detailError')}
            </div>
          )}
        </div>
      )
    },
    {
      title: intl.get('intention.creator'),
      dataIndex: 'creater_user',
      key: 'creater_user',
      // width: 200,
      render: (text: any, record: any) => (
        <>
          <div title={text} className="creator-style kw-ellipsis">
            {text || '--'}
          </div>
          {/* <div title={record?.creater_email}>{record?.creater_email}</div> */}
        </>
      )
    },
    {
      title: intl.get('intention.time'),
      key: 'create_time',
      dataIndex: 'create_time',
      // width: 247,
      sorter: true,
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sortedInfo.columnKey === 'create_time' ? sortedInfo.order : null,
      showSorterTooltip: false,
      render: (text: any, record: any) => moment(text * 1000).format('YYYY-MM-DD HH:mm:ss') || '--'
    },
    {
      title: intl.get('intention.final'),
      key: 'editor_user',
      dataIndex: 'editor_user',
      // width: 160,
      render: (text: any, record: any) => (
        <>
          <div title={text} className="creator-style kw-ellipsis">
            {text || '--'}
          </div>
          {/* <div title={record?.creater_email}>{record?.creater_email}</div> */}
        </>
      )
    },
    {
      title: intl.get('intention.finalTime'),
      key: 'edit_time',
      dataIndex: 'edit_time',
      // width: 247,
      sorter: true,
      sortDirections: [ASC, DESC, ASC],
      sortOrder: sortedInfo.columnKey === 'edit_time' ? sortedInfo.order : null,
      showSorterTooltip: false,
      render: (text: any, record: any) => moment(text * 1000).format('YYYY-MM-DD HH:mm:ss') || '--'
    }
  ];

  /**
   * 开关样式
   */
  const onStatus = (record: any) => {
    return classnames(
      // 'kw-mr-8',
      { 'kw-c-text': record?.train_status === '训练中' },
      { 'kw-c-primary': record?.train_status !== '训练中' }
    );
  };

  /**
   * 测试
   */
  const onTest = async (record: any, type?: any) => {
    try {
      type !== 'again' && setIsTestModal(true);
      type === 'again' && setTestSuccess(false);
      setTestId(record?.intentpool_id);
      const data = {
        intentpool_id: record?.intentpool_id
      };

      const { res } = await intentionService.loadModel(data);

      if (res) {
        setTestSuccess(true);
      }
    } catch (err) {
      err?.ErrorDetails && message.error(err?.ErrorDetails[0].detail);
    }
  };

  const menu = (record: any) => {
    return (
      <Menu>
        <Menu.Item
          // className={onStatus(record)}
          // style={OPERATION_STYLE}
          disabled={
            record?.train_status === '训练中' ||
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_INTENT_POOL_EDIT
            })
          }
          onClick={() => onCreateEdit('edit', record)}
        >
          {intl.get('intention.edit')}
        </Menu.Item>
        <Menu.Item
          // className={onStatus(record)}
          disabled={record?.train_status === '训练中'}
          // style={OPERATION_STYLE}
          onClick={() => onTrain(record)}
        >
          {intl.get('intention.train')}
        </Menu.Item>
        <Menu.Item
          // className={classnames(
          //   'kw-mr-8',
          //   { 'kw-c-text': record?.train_status !== '训练成功' },
          //   { 'kw-c-primary': record?.train_status === '训练成功' }
          // )}
          disabled={record?.train_status !== '训练成功'}
          // style={OPERATION_STYLE}
          onClick={() => onTest(record)}
        >
          {intl.get('intention.test')}
        </Menu.Item>
        <Menu.Item
          key="out"
          disabled={
            record?.train_status !== '训练成功' ||
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_INTENT_POOL_EXPORT_REPORT
            })
          }
          onClick={() => onExport(record)}
        >
          {intl.get('intention.export')}
        </Menu.Item>
        <Menu.Item
          key="down"
          disabled={
            record?.train_status !== '训练成功' ||
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_INTENT_POOL_EXPORT_MODEL
            })
          }
          onClick={() => onDownLoad(record)}
        >
          {intl.get('intention.download')}
        </Menu.Item>
        <Menu.Item
          key="delete"
          disabled={
            !HELPER.getAuthorByUserInfo({
              roleType: PERMISSION_CODES.ADF_INTENT_POOL_DELETE
            })
          }
          onClick={() => onDelete(record?.intentpool_id)}
        >
          {intl.get('intention.delete')}
        </Menu.Item>
      </Menu>
    );
  };

  /**
   * 表格变化
   * @param sorter 排序
   * @param extra 变化信息
   */
  const onTableChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const { order, field } = sorter as any;
    setSortedInfo(sorter);
    if (order.slice(0, 3) === 'asc') {
      onChangeTable({ page: 1, order: 'asc', rule: field });
    } else {
      onChangeTable({ page: 1, order: 'desc', rule: field });
    }
  };

  /**
   * 翻页
   */
  const onPageChange = (page: number) => {
    onChangeTable({ page });
  };

  /**
   * 取消弹窗
   */
  const handleCancel = () => {
    setIsErrorModal(false);
    setIsTestModal(false);
    setTestSuccess(false);
  };

  return (
    <div className="intention-table-box kw-mt-2">
      <ITable
        className="intention-table"
        columns={columns}
        lastColWidth={150}
        dataSource={tableData}
        onChange={onTableChange}
        pagination={{
          total: tableState.count,
          current: tableState.page,
          pageSize: PAGE_SIZE,
          onChange: onPageChange,
          className: 'data-table-pagination',
          showTitle: false,
          showSizeChanger: false
        }}
        rowKey="id"
        tableLayout="fixed"
        scroll={{ x: '100%' }}
        loading={
          tableState.loading && {
            indicator: <LoadingOutlined className="kw-c-primary" style={{ fontSize: 24 }} />
          }
        }
        emptyImage={tableState.search_name || tableState.filter_status !== '-1' ? null : createImg}
        emptyText={
          tableState.search_name || tableState.filter_status !== '-1' ? null : (
            <>
              <span className="noData-tip">{intl.get('intention.createIntent').split('|')[0]}</span>
              <span className="kw-c-primary kw-pointer" onClick={() => onCreateEdit('create')}>
                {intl.get('intention.createIntent').split('|')[1]}
              </span>
              <span className="noData-tip">{intl.get('intention.createIntent').split('|')[2]}</span>
            </>
          )
        }
        // locale={{
        //   emptyText: (
        //     <>
        //       {tableState.search_name || tableState.filter_status !== '-1' ? (
        //         <div style={{ marginTop: '64px' }}>
        //           <NoDataBox.NO_RESULT />
        //         </div>
        //       ) : (
        //         <div className="noData-box">
        //           <img src={createImg} alt="nodata"></img>
        //           <div className="noData-text">
        //             <span className="noData-tip">{intl.get('intention.createIntent').split('|')[0]}</span>
        //             <span className="kw-c-primary kw-pointer" onClick={() => onCreateEdit('create')}>
        //               {intl.get('intention.createIntent').split('|')[1]}
        //             </span>
        //             <span className="noData-tip">{intl.get('intention.createIntent').split('|')[2]}</span>
        //           </div>
        //         </div>
        //       )}
        //     </>
        //   )
        // }}
      />
      <ErrorModal isErrorModal={isErrorModal} handleCancel={handleCancel} testId={testId} errorDes={errorDes} />
      <TestIntentionModal
        isTestModal={isTestModal}
        handleCancel={handleCancel}
        testId={testId}
        testSuccess={testSuccess}
        setIsAgain={setIsAgain}
        isAgain={isAgain}
      />
    </div>
  );
};

export default IntentionTable;
