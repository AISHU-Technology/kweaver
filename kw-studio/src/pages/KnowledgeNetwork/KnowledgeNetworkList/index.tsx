import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Button, Divider, message, Dropdown, Menu, Row, Col, Typography } from 'antd';
import { LoadingOutlined, ArrowDownOutlined, EllipsisOutlined } from '@ant-design/icons';

import servicesPermission from '@/services/rbacPermission';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import { GRAPH_DB_TYPE } from '@/enums';

import HELPER from '@/utils/helper';
import { formatIQNumber, sessionStore } from '@/utils/handleFunction';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import KnowledgeModal from '@/components/KnowledgeModal';
import UploadRecordModal from '@/components/UploadRecordModal';
import UploadKnowledgeModal from '@/components/UploadKnowledgeModal';

import DeleteModal from './deleteModal';
import KwTable from '@/components/KwTable';

import NoResult from '@/assets/images/noResult.svg';
import addContentImg from '@/assets/images/create.svg';
import './index.less';
import AdExitBar from '@/components/KwExitBar';
import KwKNIcon from '@/components/KwKNIcon';
import LoadingMask from '@/components/LoadingMask';
import useRouteCache from '@/hooks/useRouteCache';
import useAdHistory from '@/hooks/useAdHistory';

const ERROR_CODE: any = {
  'Builder.service.knw_service.knwService.getKnw.RequestError': 'graphList.getListError', // 查询错误
  'Builder.controller.knowledgeNetwork_controller.getAllKnw.PermissionError': 'graphList.permissionError' // 权限错误
};
const indicator = <LoadingOutlined style={{ fontSize: 24, color: '#54639c', top: '200px' }} spin />;
const SORTER_MENU = [
  { key: 'create', text: intl.get('knowledge.byCreate') },
  { key: 'update', text: intl.get('knowledge.byUpdate') },
  { key: 'intelligence_score', text: intl.get('knowledge.byIQ') }
];
const SORTER_MAP: Record<string, string> = {
  descend: 'desc',
  ascend: 'asc',
  desc: 'descend',
  asc: 'ascend',
  create: 'creation_time',
  update: 'update_time',
  creation_time: 'create',
  update_time: 'update',
  intelligence_score: 'intelligence_score'
};
const sorter2sorter = (key: string) => SORTER_MAP[key] || key;
const { Paragraph } = Typography;
const GraphList = ({ onToPageNetwork }: any) => {
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const history = useAdHistory();
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<any>([]);
  const [sorter, setSorter] = useState(routeCache.sorter ?? { rule: 'update', order: 'desc' });
  const [pagination, setPagination] = useState({ size: 10, total: 0, page: 1 });
  const [searchValue, setSearchValue] = useState(routeCache.searchValue ?? '');
  const [selectKey, setSelectKey] = useState(0);
  const [delId, setDelId] = useState(0);
  const [operation, setOperation] = useState<any>({ type: '', visible: false, data: {} });
  const [recordVisible, setRecordVisible] = useState(false);
  const [uploadable, setUploadable] = useState<any>({ type: '', eceph_available: true }); // 图数据库类型
  const { size, total, page } = pagination;
  const [showType, setShowType] = useState<'list' | 'card'>(routeCache.showType ?? 'card');

  useEffect(() => {
    getSysConfig();
  }, []);

  useEffect(() => {
    document.title = ` ${intl.get('graphList.mygraph')}_KWeaver`;
    getData(sorter.rule, sorter.order, page);
  }, [page, sorter.rule, sorter.order]);

  useEffect(() => {
    // 获取列表权限, 判断权限
    if (_.isEmpty(tableData)) return;
    const dataIds = _.map(tableData, (item: any) => String(item.id));
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newTableData = _.map(tableData, (item: any) => {
    //     const { codes = [], isCreator = 0 } = codesData?.[item.id] || {};
    //     item.__isCreator = isCreator;
    //     item.__codes = codes;
    //     return item;
    //   });
    //   setTableData(newTableData);
    // });
    setTableData(tableData);
  }, [JSON.stringify(tableData)]);

  /** 获取系统配置信息 */
  const getSysConfig = async () => {
    try {
      const res = await servicesKnowledgeNetwork.getSysConfig();
      if (res?.res) {
        const type = res?.res.graph_db_type || '';
        const eceph = res?.res.is_ECeph_available || false;
        setUploadable({ type, eceph_available: eceph });
        sessionStore.set('graph_db_type', type); // 当前AD接入图数据库的类型
        sessionStore.set('ECeph_available', eceph); // ECeph是否可用
      }
    } catch (err) {
      //
    }
  };

  /**
   *获取列表数据
   */
  const getData = async (rule: string, order: string, page: number) => {
    setLoading(true);
    try {
      const { res = {}, ErrorCode = '' } =
        (await servicesKnowledgeNetwork.knowledgeNetGet({ size: 10000, page, rule, order })) || {};
      setTableData(res?.df || []);
      setPagination({ ...pagination, page, total: res?.count });
      if (ERROR_CODE?.[ErrorCode]) message.error(intl.get(ERROR_CODE[ErrorCode]));

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const onRefreshList = () => getData(sorter.rule, sorter.order, 1);

  // 点击进入知识网络
  // const onToPageNetwork = (id: string | number | undefined) => {
  //   if (!id) return;
  //   history.push(`/knowledge/studio-network?id=${id}`);
  // };

  /**
   * 当前页面变化
   */
  const currentChange = (page: number) => {
    setPagination({ ...pagination, page });
  };

  /**
   * 表格排序
   */
  const sortOrderChange = (_: any, __: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorter2sorter(sorter.order);
    const rule = sorter2sorter(sorter.field);
    setSorter({ rule, order });
  };

  /**
   * 搜索
   */
  const onSearch = async (value: string) => {
    const { size } = pagination;
    const knw_name = value;

    setLoading(true);
    setSearchValue(value);

    try {
      const data = { knw_name, size: 10000, page: 1, rule: sorter.rule, order: sorter.order };
      const { res = {}, ErrorCode = '' } = await servicesKnowledgeNetwork.knowledgeNetGetByName(data);

      if (res?.df) {
        setTableData(res?.df);
        setPagination({ ...pagination, total: res?.count });
      }

      if (ERROR_CODE?.[ErrorCode]) message.error(intl.get(ERROR_CODE[ErrorCode]));

      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  /**
   * 同步搜索的值
   */
  const searchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    // if (!e?.target?.value) return;
    setSearchValue(e?.target?.value);
    onSearch(e?.target?.value);
  };

  // 删除弹窗操作
  const onOpenDelete = (item: any) => setDelId(item.id);
  const onCloseDelete = () => setDelId(0);

  // 创建或者编辑弹窗操作
  const onOperation = (type = '', data: any = {}) => {
    setOperation({ type, data, visible: !!type });
  };

  /**
   * 点击排序按钮
   */
  const onSortMenuClick = (key: string) => {
    setSorter(({ rule, order }: any) => ({
      rule: key,
      order: rule === key ? (order === 'desc' ? 'asc' : 'desc') : order
    }));
  };

  const refreshTable = () => {
    getData(sorter.rule, sorter.order, page);
  };

  const renderOperate = (record: any) => {
    return (
      <Dropdown
        trigger={['click']}
        overlay={
          <Menu>
            <Menu.Item
              key="edit"
              onClick={({ domEvent }) => {
                domEvent.stopPropagation();
                onOperation('edit', record);
              }}
            >
              {intl.get('graphList.edit')}
            </Menu.Item>

            {/* {uploadable?.type === GRAPH_DB_TYPE?.NEBULA ? (
              <Menu.Item
                key="upload"
                disabled={!record?.__isCreator}
                onClick={({ domEvent }) => {
                  domEvent.stopPropagation();
                  onOperation('upload', record);
                }}
              >
                {intl.get('graphList.upload')}
              </Menu.Item>
            ) : null} */}
            <Menu.Item
              key="delete"
              onClick={({ domEvent }) => {
                domEvent.stopPropagation();
                onOpenDelete(record);
              }}
            >
              {intl.get('graphList.delete')}
            </Menu.Item>
            <Menu.Item
              key="authorityManagement"
              onClick={({ domEvent }) => {
                domEvent.stopPropagation();
                setRouteCache({
                  showType,
                  searchValue,
                  sorter
                });
                history.push(`/knowledge/knowledge-net-auth?knId=${record.id}&knName=${record.knw_name}`);
              }}
            >
              {intl.get('graphList.authorityManagement')}
            </Menu.Item>
          </Menu>
        }
      >
        <Format.Button
          size={showType === 'card' ? 'small' : 'middle'}
          onClick={event => event.stopPropagation()}
          className="kw-table-operate"
          type="icon"
        >
          <EllipsisOutlined style={{ fontSize: 20 }} />
        </Format.Button>
      </Dropdown>
    );
  };

  const columns: any = [
    // {
    //   title: 'ID',
    //   dataIndex: 'id',
    //   width: 96
    // },
    {
      title: intl.get('graphList.tablename'),
      dataIndex: 'knw_name',
      width: 360,
      fixed: true,
      render: (text: string, record: any) => {
        const { id = '', color = '', knw_description = '' } = record;
        return (
          <div className="columnKnwName" style={{ width: 250 }} onClick={() => onToPageNetwork(id)}>
            <KwKNIcon size={32} type={color} fontSize={16} />
            <div className="name-text" title={text}>
              <div className="name kw-ellipsis">{text}</div>
              {knw_description ? (
                <div className="des  kw-ellipsis">{knw_description}</div>
              ) : (
                <div className="des-null">{intl.get('graphList.notDes')}</div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('global.operation'),
      dataIndex: 'op',
      width: 76,
      fixed: true,
      render: (text: string, record: any) => {
        return renderOperate(record);
      }
    },
    {
      title: intl.get('global.domainIQ'),
      dataIndex: 'intelligence_score',
      // width: 100,
      sorter: true,
      sortOrder: sorter.rule === 'intelligence_score' && sorter2sorter(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      render: (score: number) => formatIQNumber(score)
    },
    {
      title: intl.get('graphList.creator'),
      dataIndex: 'creator_name',
      // width: 100,
      ellipsis: true,
      render: (text: string, record: any) => {
        return (
          <div className="creator-box">
            <div className="name kw-ellipsis" title={record.creator_name}>
              {record.creator_name}
            </div>
            {/* <div className="email kw-ellipsis" title={record.creator_email}>
              {record.creator_email}
            </div> */}
          </div>
        );
      }
    },
    {
      title: intl.get('global.creationTime'),
      dataIndex: 'creation_time',
      // width: 160,
      sorter: true,
      sortOrder: sorter.rule === 'create' && sorter2sorter(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend']
    },
    {
      title: intl.get('global.finalOperator'),
      dataIndex: 'operator_name',
      // width: 120,
      ellipsis: true,
      render: (text: string, record: any) => {
        return (
          <div className="creator-box">
            <div className="name" title={record.operator_name}>
              {record.operator_name}
            </div>
            {/* <div className="email" title={record.operator_email}>
              {record.operator_email}
            </div> */}
          </div>
        );
      }
    },
    {
      title: intl.get('global.finalOperatorTime'),
      dataIndex: 'update_time',
      // width: 160,
      sorter: true,
      sortOrder: sorter.rule === 'update' && sorter2sorter(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend']
    }
  ];

  return (
    <div className="netWork kw-flex-column kw-flex-item-full-height">
      <AdExitBar title={intl.get('graphList.knowledgeNetManage')} />
      <div style={{ margin: '16px 24px 24px 24px' }} className="kw-bg-white kw-flex-column kw-flex-item-full-height">
        {/* <Format.Title className="kw-mb-3">{intl.get('graphList.mygraph')}</Format.Title>*/}
        <div className="kw-space-between kw-mb-4">
          <div>
            <Button type="primary" onClick={() => onOperation('add')}>
              <IconFont type="icon-Add" style={{ color: '#fff' }} />
              {intl.get('graphList.create')}
            </Button>
          </div>

          <div className="kw-align-center">
            <SearchInput
              className="kw-mr-2"
              placeholder={intl.get('graphList.searchName')}
              onChange={searchChange}
              onPressEnter={(e: any) => onSearch(e?.target?.value)}
              onClear={() => onSearch('')}
              debounce
            />
            {/* {uploadable?.type === GRAPH_DB_TYPE?.NEBULA && (
                <Button
                  className="kw-ml-3 kw-pl-4 kw-pr-4"
                  icon={<IconFont type="icon-fabu" />}
                  onClick={() => setRecordVisible(true)}
                  disabled
                >
                  {intl.get('uploadService.uploadManage')}
                </Button>
            )} */}
            <Dropdown
              placement="bottomLeft"
              overlay={
                <Menu selectedKeys={[sorter.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                  {SORTER_MENU.map(({ key, text }) => (
                    <Menu.Item key={key}>
                      <ArrowDownOutlined
                        className="kw-mr-2"
                        rotate={sorter.order === 'desc' ? 0 : 180}
                        style={{ opacity: sorter.rule === key ? 0.8 : 0, fontSize: 16, transform: 'translateY(1px)' }}
                      />
                      {text}
                    </Menu.Item>
                  ))}
                </Menu>
              }
            >
              <Format.Button type="icon">
                <IconFont type="icon-paixu11" />
              </Format.Button>
            </Dropdown>

            <Format.Button
              type="icon"
              tip={showType === 'card' ? intl.get('graphList.switchList') : intl.get('graphList.switchCard')}
              onClick={() => {
                if (showType === 'card') {
                  setShowType('list');
                } else {
                  setShowType('card');
                }
              }}
            >
              <IconFont type={`${showType === 'card' ? 'icon-liebiao' : 'icon-wanggemoshi'}`} />
            </Format.Button>

            <Format.Button type="icon" tip={intl.get('global.refresh')} onClick={refreshTable}>
              <IconFont type="icon-tongyishuaxin" />
            </Format.Button>
          </div>
        </div>
        <div className="table-box kw-flex-item-full-height">
          {showType === 'card' ? (
            <>
              <LoadingMask loading={loading} />
              <div className="netWork-card-wrapper">
                {tableData.map((item: any) => (
                  <div
                    className="netWork-card-item kw-flex-column kw-p-4 kw-pointer"
                    key={item.id}
                    onClick={() => onToPageNetwork(item.id)}
                  >
                    <div className="kw-align-center kw-mb-4" title={item.knw_name}>
                      <span className="kw-flex-item-full-width kw-align-center">
                        <KwKNIcon size={32} type={item.color} fontSize={16} />
                        <span
                          style={{ fontWeight: 500 }}
                          className="kw-ml-2 kw-c-header kw-flex-item-full-width kw-ellipsis"
                        >
                          {item.knw_name}
                        </span>
                      </span>
                      {renderOperate(item)}
                    </div>
                    <div
                      className="kw-flex-item-full-width"
                      style={{ marginBottom: 20, lineHeight: '18px' }}
                      title={item.knw_description}
                    >
                      <Paragraph
                        style={{
                          color: `rgba(0,0,0,0.${item.knw_description ? 6 : 2}5)`,
                          marginBottom: 0
                        }}
                        ellipsis={{ rows: 2 }}
                      >
                        {item.knw_description || intl.get('graphList.notDes')}
                      </Paragraph>
                    </div>
                    <div
                      title={`${item.update_time}`}
                      className="kw-c-subtext kw-ellipsis kw-align-center"
                      style={{ fontSize: 12 }}
                    >
                      <span>{item.operator_name}</span>
                      <Divider type="vertical" />
                      <span className="kw-align-center">
                        <IconFont type="icon-gengxinshijian" className="kw-mr-1" />
                        <span>{item.update_time}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <KwTable
              lastColWidth={170}
              showHeader={false}
              columns={columns}
              scroll={{ y: 460 }}
              dataSource={tableData}
              onChange={sortOrderChange}
              rowKey={(record: any) => record.id}
              loading={loading ? { indicator } : false}
              onRow={record => ({ onClick: () => setSelectKey(record.id) })}
              rowClassName={(record: any) => (record?.id === selectKey ? 'selectRow' : '')}
              // pagination={{
              //   total,
              //   current: page,
              //   pageSize: size,
              //   showTitle: false,
              //   showSizeChanger: false,
              //   onChange: currentChange,
              //   showTotal: total => intl.get('graphList.total', { total })
              // }}
              pagination={false}
              locale={{
                emptyText: !searchValue ? (
                  <div className="nodata-box">
                    <img src={addContentImg} alt="nodata" />
                    <div className="nodata-text">
                      <ContainerIsVisible placeholder={<div>{intl.get('graphList.noContent')}</div>}>
                        <span>{intl.get('graphList.click')}</span>
                        <span className="create-span" onClick={() => onOperation('add')}>
                          {intl.get('global.emptyTableCreate')}
                        </span>
                        <span>{intl.get('graphList.addNetwork')}</span>
                      </ContainerIsVisible>
                    </div>
                  </div>
                ) : (
                  <div className="nodata-box">
                    <img src={NoResult} alt="nodata" />
                    <div className="nodata-text">{intl.get('global.noResult2')}</div>
                  </div>
                )
              }}
            />
          )}
        </div>

        <KnowledgeModal
          visible={operation.visible && ['add', 'edit'].includes(operation.type)}
          source={operation}
          onSuccess={onRefreshList}
          onToPageNetwork={onToPageNetwork}
          onCancel={() => {
            setOperation({});
            setTimeout(() => {
              if (onRefreshList) onRefreshList(); // 因为是异步任务，所以需要延迟查询
            }, 100);
          }}
        />

        <DeleteModal visible={!!delId} delId={delId} onCloseDelete={onCloseDelete} onRefreshList={onRefreshList} />

        <UploadKnowledgeModal
          visible={operation.visible && operation.type === 'upload'}
          kgData={operation.data}
          onCancel={() => {
            setOperation({});
            onRefreshList();
          }}
        />
      </div>
      <div className="uploadManageModelRoot" style={{ display: recordVisible ? 'block' : 'none' }}>
        <UploadRecordModal isIq={false} visible={recordVisible} onCancel={() => setRecordVisible(false)} />
      </div>
    </div>
  );
};

export default GraphList;
