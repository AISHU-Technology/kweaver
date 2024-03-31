import React, { useEffect, useRef, useState } from 'react';
import { Table, Button, Dropdown, Menu, message } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table/interface';
import { LoadingOutlined, ArrowDownOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useHistory } from 'react-router-dom';
import intl from 'react-intl-universal';
import HOOKS from '@/hooks';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import { CALCULATE_STATUS, PERMISSION_CODES, GRAPH_DB_TYPE, PERMISSION_KEYS } from '@/enums';
import HELPER from '@/utils/helper';
import { formatID, formatIQNumber, sessionStore } from '@/utils/handleFunction';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import ExplainTip from '@/components/ExplainTip';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import UploadRecordModal from '@/components/UploadRecordModal';
import UploadKnowledgeModal from '@/components/UploadKnowledgeModal';

import { ListItem, TableState, RecordOperation, KgInfo } from '../types';
import noResImg from '@/assets/images/noResult.svg';
import emptyImg from '@/assets/images/empty.svg';
import './style.less';
import ADTable from '@/components/ADTable';
import serviceGraphDetail from '@/services/graphDetail';

const PAGE_SIZE = 10;
const DESC = 'descend' as const;
const ASC = 'ascend' as const;
const URL_ANALYSIS = 'analysis';
const URL_GRAPH = 'graph';
const URL_ENGINE = 'search';
const SORTER_MENU = [
  { key: 'data_quality_B', text: intl.get('intelligence.byKnwSource') },
  { key: 'data_quality_score', text: intl.get('intelligence.byQualitySource') },
  { key: 'update_time', text: intl.get('knowledge.byUpdate') }
];
const ORDER_MAP: Record<string, string> = {
  [DESC]: 'desc',
  [ASC]: 'asc',
  desc: DESC,
  asc: ASC
};
const order2order = (order: string) => ORDER_MAP[order] || order;

/**
 * 提前查询图谱所在的页数
 * @param knw_id 知识网络id
 * @param id 图谱id
 */
const queryPage = async (knw_id: number, id: number) => {
  const data = { knw_id, page: 1, size: 1000, order: 'desc', name: '', rule: 'update' };
  try {
    const res = await servicesKnowledgeNetwork.graphGetByKnw(data);
    if (!res?.res) return 1;
    const { df } = res.res;
    const index = df.findIndex((d: any) => d.id === id);
    return Math.ceil((index + 1) / 20) || 1;
  } catch (error) {
    return 1;
  }
};

interface QTableProps {
  kgInfo: KgInfo;
  knData: any;
  data: ListItem[];
  tableState: TableState;
  onChange: (state: Partial<TableState>) => void;
}

const IQTable: React.FC<QTableProps> = ({ kgInfo, data, tableState, knData, onChange }) => {
  const inputRef = useRef<any>();
  const history = useHistory();
  const language = HOOKS.useLanguage();
  const [recordOperation, setRecordOperation] = useState<RecordOperation>({
    type: '',
    visible: false,
    data: {}
  } as RecordOperation);
  const [uploadable, setUploadable] = useState<any>({ ad_graph_db_type: '', eceph_available: true }); // 图数据库类型

  useEffect(() => {
    getSysConfig();
  }, []);

  /** 获取系统配置信息 */
  const getSysConfig = async () => {
    try {
      const res = await servicesKnowledgeNetwork.getSysConfig();
      if (res?.res) {
        const type = res?.res.graph_db_type || '';
        const eceph = res?.res.is_ECeph_available || false;
        setUploadable({ ad_graph_db_type: type, eceph_available: eceph });
      }
    } catch (err) {
      //
    }
  };

  /**
   * 点击上传
   */
  const onUpload = () => {
    if (!kgInfo.id) return;
    setRecordOperation({ type: 'upload', visible: true, data: { ...kgInfo } });
  };

  /**
   * 点击查看上传记录
   */
  const onViewRecords = () => {
    setRecordOperation({ type: 'record', visible: true });
  };

  /**
   * 关闭 上传、上传记录 弹窗
   */
  const closeRecordModal = () => {
    setRecordOperation({ type: '', visible: false, data: {} } as RecordOperation);
  };

  /**
   * 触发搜索
   */
  const onSearch = () => {
    onChange({ page: 1, query: inputRef.current.input.value });
  };

  /**
   * 点击排序按钮
   */
  const onSortMenuClick = (key: string) => {
    const { rule, order } = tableState;
    onChange({
      rule: key,
      order: rule === key ? (order === order2order(DESC) ? order2order(ASC) : order2order(DESC)) : order
    });
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
  const onTableChange: TableProps<ListItem>['onChange'] = (_, __, sorter, extra) => {
    if (extra.action !== 'sort') return;
    const { order, field } = sorter as any;
    onChange({ page: 1, order: order2order(order), rule: field });
  };

  /**
   * 点击操作栏链接按钮跳转
   * @param url 跳转的地址
   * @param record 列表行数据
   */
  const onJump = async (url: string, record: ListItem) => {
    const { graph_id, graph_name } = record;

    if (url === URL_GRAPH) {
      return history.push(`/knowledge/studio-network?id=${kgInfo.id}&gid=${graph_id}&tab_detail_key=basicInfo`);
    }

    if (url === URL_ANALYSIS) {
      try {
        await serviceGraphDetail.graphGetInfoOnto({ graph_id });
      } catch (err) {
        const { type, response } = err as any;
        if (type === 'message') message.error(response?.Description || '');
        return;
      }
      history.push(
        `/knowledge/explore?knId=${sessionStore.get(
          'selectedKnowledgeId'
        )}&opType=add&graphId=${graph_id}&graphConfId=${graph_id}&kg_name=${graph_name}`
      );
    }
    // if (url === URL_ENGINE)
    // return history.push(`/cognitive-application/domain-search?id=${kgInfo.id}&gid=${graph_id}`);
  };

  /**
   * 渲染分数
   * @param source 分数
   * @param status 计算状态
   */
  const renderSource = (source: number, status: string) => {
    return status === CALCULATE_STATUS.IN_CALCULATING ? (
      <>
        <LoadingOutlined className="kw-c-primary kw-mr-1 kw-c-subtext" />
        {intl.get('intelligence.calculating')}
      </>
    ) : (
      formatIQNumber(source)
    );
  };

  const columns: ColumnsType<ListItem> = [
    {
      title: intl.get('global.graphName'),
      dataIndex: 'graph_name',
      fixed: 'left',
      ellipsis: true,
      width: 240,
      render: (name, record) => (
        <div className="name-column kw-pointer kw-align-center" onClick={() => onJump(URL_GRAPH, record)}>
          <IconFont className="kw-mr-2" type="icon-color-zhishitupu11" style={{ fontSize: 16 }} />
          <Format.Text className="name-column-text kw-ellipsis" title={name}>
            {name}
          </Format.Text>
        </div>
      )
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'op',
      fixed: 'left',
      width: 76,
      render: (_: unknown, record: ListItem) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onJump(URL_GRAPH, record);
                  }}
                >
                  {intl.get('global.view')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onJump(URL_ANALYSIS, record);
                  }}
                >
                  {intl.get('global.analysis')}
                </Menu.Item>
                {/* <Menu.Item*/}
                {/*  onClick={({ domEvent }) => {*/}
                {/*    domEvent.stopPropagation();*/}
                {/*    onJump(URL_ENGINE, record);*/}
                {/*  }}*/}
                {/* >*/}
                {/*  {intl.get('global.knowledgeSearch')}*/}
                {/* </Menu.Item>*/}
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
      title: <div>ID</div>,
      dataIndex: 'graph_id',
      // width: language === 'en-US' ? 170 : 110,
      render: id => formatID(id)
    },
    {
      title: (
        <>
          {intl.get('intelligence.knwSource')}
          <ExplainTip.KNW_SOURCE />
        </>
      ),
      dataIndex: 'data_quality_B',
      // width: 170,
      sorter: true,
      sortOrder: tableState.rule === 'data_quality_B' && (order2order(tableState.order) as any),
      sortDirections: [ASC, DESC, ASC],
      render: (source, record) => renderSource(source, record.calculate_status)
    },
    {
      title: (
        <>
          {intl.get('intelligence.qualitySource')}
          <ExplainTip.QUALITY_SOURCE />
        </>
      ),
      dataIndex: 'data_quality_score',
      // width: 170,
      sorter: true,
      sortOrder: tableState.rule === 'data_quality_score' && (order2order(tableState.order) as any),
      sortDirections: [ASC, DESC, ASC],
      render: (source, record) => renderSource(source, record.calculate_status)
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      // width: 170,
      sorter: true,
      sortOrder: tableState.rule === 'update_time' && (order2order(tableState.order) as any),
      sortDirections: [ASC, DESC, ASC]
    }
  ];

  return (
    <div className="kg-iq-table">
      <Format.Title className="">{intl.get('intelligence.domainDetail')}</Format.Title>
      <div className="kw-space-between kw-mb-4">
        <div className="left-box kw-align-center">
          {/* {uploadable?.ad_graph_db_type === GRAPH_DB_TYPE?.NEBULA && (
            <ContainerIsVisible
              isVisible={
                knData?.__isCreator
                  ? true
                  : HELPER.getAuthorByUserInfo({
                      roleType: PERMISSION_CODES.ADF_KN_KG_CREATE_IMPORT,
                      userType: PERMISSION_KEYS.KG_UPLOAD,
                      userTypeDepend: knData?.__codes
                    })
              }
            >
              <Button className="kw-mr-2" type="primary" onClick={onUpload}>
                <IconFont type="icon-shangchuan" />
                {intl.get('graphList.upload')}
              </Button>
            </ContainerIsVisible>
          )} */}

          {/* <span className="permission-tip kw-ellipsis">{intl.get('intelligence.permissionTip')}</span> */}
        </div>

        <div className="kw-align-center">
          <SearchInput ref={inputRef} placeholder={intl.get('knowledge.search')} onPressEnter={onSearch} />
          {/* 上传管理屏蔽掉 */}
          {/* {uploadable?.ad_graph_db_type === GRAPH_DB_TYPE?.NEBULA && (
            <ContainerIsVisible
              isVisible={HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_KN_UPLOAD_RECORD
              })}
            >
              <Button className="kw-ml-3 kw-pl-4 kw-pr-4"
              icon={<IconFont type="icon-fabu" />} onClick={onViewRecords}>
                {intl.get('uploadService.uploadManage')}
              </Button>
            </ContainerIsVisible>
          )} */}
          <Dropdown
            placement="bottomLeft"
            overlay={
              <Menu selectedKeys={[tableState.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                {SORTER_MENU.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      className="kw-mr-2"
                      rotate={tableState.order === 'desc' ? 0 : 180}
                      style={{ opacity: tableState.rule === key ? 0.8 : 0, fontSize: 15 }}
                    />
                    {text}
                  </Menu.Item>
                ))}
              </Menu>
            }
          >
            <Format.Button className="kw-ml-3" type="icon">
              <IconFont type="icon-paixu11" />
            </Format.Button>
          </Dropdown>

          <Format.Button type="icon" tip={intl.get('global.refresh')} onClick={() => onChange({})}>
            <IconFont type="icon-tongyishuaxin" />
          </Format.Button>
        </div>
      </div>
      <div className="main-table">
        <ADTable
          showHeader={false}
          lastColWidth={170}
          dataSource={data}
          columns={columns}
          rowKey="graph_id"
          tableLayout="fixed"
          scroll={{ x: '100%' }}
          onChange={onTableChange}
          pagination={{
            current: tableState.page,
            total: tableState.total,
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
          locale={{
            emptyText: (
              <div className="kw-mt-9 kw-mb-9">
                <img src={tableState.query ? noResImg : emptyImg} alt="nodata" className="kw-tip-img" />
                <div className="kw-c-text">{intl.get(`global.${tableState.query ? 'noResult' : 'noContent'}`)}</div>
              </div>
            )
          }}
        />
      </div>

      <UploadKnowledgeModal
        visible={recordOperation.visible && recordOperation.type === 'upload'}
        kgData={recordOperation.data || {}}
        onCancel={closeRecordModal}
      />

      <div
        className="uploadManageModelRoot"
        style={{ display: recordOperation.visible && recordOperation.type === 'record' ? 'block' : 'none' }}
      >
        <UploadRecordModal
          visible={recordOperation.visible && recordOperation.type === 'record'}
          isIq={true}
          onCancel={closeRecordModal}
        />
      </div>
    </div>
  );
};

export default IQTable;
