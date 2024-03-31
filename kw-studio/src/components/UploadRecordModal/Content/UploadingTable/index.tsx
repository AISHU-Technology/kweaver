import React, { useEffect, useState } from 'react';
import { Table, Select, Tooltip, Button, Dropdown, Menu, Progress, message } from 'antd';
import { LoadingOutlined, ArrowDownOutlined, CloseCircleFilled } from '@ant-design/icons';
import intl from 'react-intl-universal';
import { UPLOAD_RECORD_STATUS } from '@/enums';
import _ from 'lodash';
import uploadService from '@/services/uploadKnowledge';
import Format from '@/components/Format';
import SearchInput from '@/components/SearchInput';
import IconFont from '@/components/IconFont';
import TemplateModal from '@/components/TemplateModal';
import AvatarName from '@/components/Avatar';
import RecordDetail from '../RecordDetail';
import kongImg from '@/assets/images/kong.svg';
import noResultImg from '@/assets/images/noResult.svg';

import './style.less';
const { Option } = Select;

type UploadingTableProps = {
  tabsKey: string;
  pageSize: number;
  data: any[];
  detailData: any;
  tableState: any;
  isIq?: true | false; // 是否是领域智商进来的
  filterKgData: any[]; // 知识网络列表
  onChange: (state?: any, isloading?: any) => void;
  onDetail: (item: any) => void;
};

const { WAIT, PROGRESS, COMPLETE, FAILED } = UPLOAD_RECORD_STATUS;
const SORTER_MENU = [
  { key: 'created', text: intl.get('knowledge.byCreate') },
  { key: 'started', text: intl.get('uploadService.byStartTime') },
  { key: 'updated', text: intl.get('uploadService.byEndTime') }
];
const ERROR_CODE: Record<string, string> = {
  'DataIO.Common.KgNotFoundException': intl.get('uploadService.graphNotFount'),
  'DataIO.Common.UploadUnsupportedException': intl.get('uploadService.abnormalGraph')
};
const sort2Reverse = (sort: string) => (sort === 'descend' ? 1 : 0);
const reverse2Sort = (reverse: number) => (reverse ? 'descend' : 'ascend');
const UploadingTable = (props: UploadingTableProps) => {
  const { data, tableState, isIq, detailData, filterKgData, pageSize, onDetail, onChange } = props;
  const [detailVisible, setDetailVisible] = useState<boolean>(false); // 详情弹窗

  /**
   * 触发排序
   */
  const onTableChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const field = sorter.field === 'finished' ? 'updated' : sorter.field;

    onChange({ page: 1, order: field, reverse: sort2Reverse(sorter.order) });
  };

  /**
   * 按知识网络过滤
   * @param kId 知识网络id
   */
  const onKgChange = (kId: number) => {
    if (!kId) return onChange({ page: 1, kId: 0 });

    onChange({ page: 1, kId });
  };

  /**
   * 换页
   */
  const onPageChange = (page: number) => {
    onChange({ page });
  };

  /**
   * 排序变化
   */
  const onChangeRule = (key: any) => {
    const { order, reverse } = tableState;

    if (key === order) {
      const or = reverse === 1 ? 0 : 1;

      onChange({ page: 1, order: key, reverse: or });
      return;
    }
    onChange({ page: 1, order: key });
  };

  /**
   * 监听搜索框
   */
  const onSearch = (e: any) => {
    onChange({ page: 1, keyword: e?.target?.value });
  };

  /**
   * 继续上传
   * @param id 任务id
   */
  const continueUpload = async (id: string) => {
    if (!id) return;
    try {
      const response = await uploadService.uploadContinue({ id });

      if (response?.res === 'ok') {
        onChange({ page: 1, keyWord: '' });
        message.success(intl.get('uploadService.uploadingTip'));
      }
      if (response?.ErrorCode) {
        ERROR_CODE[response?.ErrorCode]
          ? message.error(ERROR_CODE[response?.ErrorCode])
          : message.error(response?.Description);
      }
    } catch (err) {}
  };

  /**
   * 重新上传
   */
  const reUpload = async (record: any) => {
    try {
      const { res, Description, ErrorCode } = await uploadService.uploadKnowledge({
        knId: record.knw_id,
        ip: record.ip,
        token: record.token,
        graphIds: [record?.kg_id],
        identifyId: record.identifyId
      });
      if (res) {
        onChange({ page: 1, keyWord: '' });
        message.success(intl.get('uploadService.uploadingTip'));
      }

      if (ErrorCode) {
        ERROR_CODE[ErrorCode] ? message.error(ERROR_CODE[ErrorCode]) : message.error(Description);
      }
    } catch (err) {
      //
    }
  };

  /**
   * 关闭详情弹窗
   */
  const onCloseDetail = () => {
    setDetailVisible(false);
    onDetail({});
  };

  /**
   * 渲染状态
   */
  const getStatus = (record: any) => {
    const { transferStatus, transferState, transferProgress } = record;
    const failed: Record<string, string> = {
      3: intl.get('uploadService.importFailed'),
      2: intl.get('uploadService.transFailed'),
      1: intl.get('uploadService.exportFailed')
    };
    const totalProgress = 1 / 3;
    const base = Number(transferState) >= 1 ? (Number(transferState) - 1) * 33 : 0;
    const recordPercent = Math.floor(base + transferProgress * totalProgress * 100);
    if (transferStatus === FAILED) {
      return (
        <div>
          <CloseCircleFilled className="kw-c-error" />
          <span className="kw-ml-2 kw-pr-2">{failed[transferState]}</span>
          <span
            className="kw-c-primary kw-pointer"
            onClick={() => {
              onDetail(record);
              setDetailVisible(true);
            }}
          >
            {intl.get('uploadService.detail')}
          </span>
        </div>
      );
    }
    return (
      <div className="kw-align-center">
        <div style={{ width: 190 }}>
          <Progress
            percent={recordPercent}
            format={(percent: any) => {
              if (percent === 0) return '';
              return `${percent}%`;
            }}
          />
        </div>
        {recordPercent === 0 ? (
          <span className="statusWaiting">{intl.get('uploadService.waiting')}</span>
        ) : (
          <span
            className="kw-c-primary kw-pointer kw-ml-2 statusDetail"
            onClick={() => {
              onDetail(record);
              setDetailVisible(true);
            }}
          >
            {intl.get('uploadService.detail')}
          </span>
        )}
      </div>
    );
  };

  const columns: any = [
    {
      title: intl.get('uploadService.graphName'),
      dataIndex: 'graphName',
      ellipsis: true,
      fixed: 'left',
      width: 300,
      render: (name: any, record: any) => {
        return (
          <div className="kw-align-center kw-w-100">
            <div className="img kw-center kw-border">
              <IconFont type="icon-zhishiwangluo" className="icon"></IconFont>
            </div>
            <div className="kw-ml-3 kw-w-80">
              <div className="kw-ellipsis kw-c-header kw-w-100" title={name}>
                {name}
              </div>
              <div className="kw-ellipsis kw-c-text">ID: {record?.kg_id}</div>
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('uploadService.status'),
      dataIndex: 'transferProgress',
      ellipsis: true,
      fixed: 'left',
      width: 200,
      render: (text: number, record: any) => getStatus(record)
    },
    {
      title: intl.get('uploadService.knowledgeName'),
      dataIndex: 'relatedGraphNetName',
      ellipsis: true,
      width: 300,
      render: (name: string, record: any) => {
        return (
          <div className="kw-align-center kw-w-100">
            <AvatarName str={name} color={record?.knw_color} />
            <div className="kw-ml-2 kw-w-80">
              <div className="kw-ellipsis kw-c-header kw-w-100" title={name}>
                {name}
              </div>
              <div className="kw-ellipsis kw-c-text">ID: {record.knw_id}</div>
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('uploadService.operator'),
      dataIndex: 'operator',
      ellipsis: true,
      width: 190,
      render: (text: any) => text || '- -'
    },
    {
      title: intl.get('uploadService.targetIp'),
      dataIndex: 'ip',
      ellipsis: true,
      width: 250
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'created',
      ellipsis: true,
      width: 190,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.order === 'created' && reverse2Sort(tableState.reverse),
      showSorterTooltip: false,
      render: (time: string) => time || '- -'
    },
    {
      title: intl.get('uploadService.startTime'),
      dataIndex: 'started',
      ellipsis: true,
      width: 160,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.order === 'started' && reverse2Sort(tableState.reverse),
      showSorterTooltip: false,
      render: (time: string) => time || '- -'
    },
    {
      title: intl.get('uploadService.endTime'),
      dataIndex: 'finished',
      ellipsis: true,
      width: 160,
      sorter: true,
      sortDirections: ['ascend', 'descend', 'ascend'],
      sortOrder: tableState.order === 'updated' && reverse2Sort(tableState.reverse),
      showSorterTooltip: false,
      render: (_: string, record: any) => {
        const { transferStatus, updated, finished } = record;
        if (transferStatus === FAILED) return finished || updated || '- -';
        return finished || '- -';
      }
    },
    {
      title: intl.get('uploadService.operation'),
      width: 256,
      fixed: 'right',
      render: (_: string, record: any) => {
        const { transferState, transferStatus } = record;
        // 当导出失败后，则仅支持用户【重新上传】 0-开始 1-导出 2-传输 3-导入 4-完成
        const reUpDis = transferStatus !== FAILED || transferState === '0';
        // 当传输失败/导入失败后，则支持用户【继续上传】【重新上传】
        const contineDis = transferStatus !== FAILED || transferState === '0' || transferState === '1';
        return (
          <div className="op-column">
            <Button type="link" disabled={contineDis} onClick={() => continueUpload(record?.id)}>
              {intl.get('uploadService.resume')}
            </Button>
            <Button type="link" disabled={reUpDis} onClick={() => reUpload(record)}>
              {intl.get('uploadService.reupload')}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="uploadingTableRoot">
      <div className="kw-mb-5 kw-space-between">
        <div></div>
        <div>
          {!isIq && (
            <>
              <Format.Text className="kw-mr-3">{intl.get('uploadService.relationKg')}</Format.Text>
              <Select
                allowClear
                className="kw-mr-3"
                style={{ width: 220 }}
                value={tableState.kId}
                onChange={onKgChange}
              >
                <Option value={0}>{intl.get('global.all')}</Option>
                {filterKgData.map((item: any) => (
                  <Option key={item.id} value={item.id}>
                    {item.name}
                  </Option>
                ))}
              </Select>
            </>
          )}
          <SearchInput placeholder={intl.get('knowledge.search')} onChange={onSearch} debounce />
          <Dropdown
            placement="bottomLeft"
            overlay={
              <Menu selectedKeys={[tableState?.order]} onClick={({ key }) => onChangeRule(key)}>
                {SORTER_MENU.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState?.reverse === 1 ? 0 : 180}
                      style={{
                        opacity: tableState?.order === key ? 0.8 : 0,
                        fontSize: 16,
                        transform: 'translateY(1px)'
                      }}
                    />
                    {text}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Button className="kw-ml-3 sortDataBtn">
              <IconFont type="icon-paixu11" className="sort-icon" />
            </Button>
          </Dropdown>
          <Tooltip placement="topLeft" title={intl.get('uploadService.refresh')}>
            <Button className="kw-ml-3 refreshBtn" style={{ minWidth: 32 }} onClick={() => onChange({}, false)}>
              <IconFont type="icon-tongyishuaxin" />
            </Button>
          </Tooltip>
        </div>
      </div>
      <div className="kw-h-100">
        <Table
          columns={columns}
          tableLayout="fixed"
          scroll={{ x: '100%' }}
          dataSource={data}
          rowKey="id"
          loading={tableState?.loading && { indicator: <LoadingOutlined className="loading-icon" /> }}
          onChange={onTableChange}
          pagination={{
            className: 'kw-mt-6',
            showTitle: false,
            pageSize,
            total: tableState?.total,
            onChange: onPageChange,
            showSizeChanger: false,
            current: tableState?.page
          }}
          locale={{
            emptyText: (
              <div className="empty-box">
                <img src={tableState?.keyword ? noResultImg : kongImg} alt="no data" className="kw-tip-img" />
                <div className="kw-c-text">
                  {tableState?.keyword ? intl.get('global.noResult2') : intl.get('uploadService.uploadingEmpty')}
                </div>
              </div>
            )
          }}
        />
      </div>
      <TemplateModal
        header={
          <div className="kw-align-center kw-pl-6 kw-border-b" style={{ height: 52 }}>
            <div>
              <span className="kw-c-header">{intl.get('global.detail')}</span>
              <IconFont type="icon-tongyishuaxin" className="kw-c-header kw-ml-3" onClick={() => onChange({}, false)} />
            </div>
          </div>
        }
        width={800}
        visible={detailVisible}
        onCancel={onCloseDetail}
        footer={null}
      >
        <RecordDetail onCancel={() => {}} loading={tableState?.loading} onRefresh={onTableChange} record={detailData} />
      </TemplateModal>
    </div>
  );
};
export default (props: any) => {
  if (props?.tabsKey === 'uploading') return <UploadingTable {...props} />;
  return null;
};
