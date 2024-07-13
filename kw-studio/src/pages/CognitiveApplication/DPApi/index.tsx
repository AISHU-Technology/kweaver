import React, { useEffect, useReducer, useState, useRef } from 'react';
import KwTable from '@/components/KwTable';
import Format from '@/components/Format';
import _ from 'lodash';
import intl from 'react-intl-universal';
import {
  LoadingOutlined,
  EllipsisOutlined,
  PlusOutlined,
  InfoCircleOutlined,
  ArrowDownOutlined
} from '@ant-design/icons';
import { Table, Tag, Button, Tooltip, message, Select, Dropdown, Menu, Input, Space } from 'antd';
import { useHistory } from 'react-router-dom';
import IconFont from '@/components/IconFont';
import { getParam, localStore, copyToBoard, getTextByHtml, kwCookie } from '@/utils/handleFunction';
import servicesDpapi from '@/services/dpapi';
import './style.less';
import mysqlImg from '@/assets/images/mysql.svg';
import { DESC, ASC, FILTER_OPTION, SORTER_FIELD, STATUS_COLOR, SORTED_FIELD_MAP_CODE } from './enum';
import noResImg from '@/assets/images/noResult.svg';
import createImg from '@/assets/images/create.svg';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { tipModalFunc } from '@/components/TipModal';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import servicesDataSource from '@/services/dataSource';
import { DATA_SOURCE } from '@/pages/DPApiService/FirstSQLSetting/enums';
import Cookie from 'js-cookie';
import KwKNIcon from '@/components/KwKNIcon';

const indicator = <LoadingOutlined style={{ fontSize: 24, color: '#54639c', top: '200px' }} spin />;

const DBApi = (props: any) => {
  const { knData } = props;
  const kwId = getParam('id');
  const history = useHistory();
  const generatorDefaultAll = () => {
    const defaultAllValue = {
      id: '-1',
      text: intl.get('dpapiList.publishAllStatus'),
      color: 'icon-color-zswl8'
    };
    return JSON.parse(JSON.stringify(defaultAllValue));
  };

  const language = kwCookie.get('kwLang') || 'zh-CN';
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState([]);

  const [searchStatus, setSearchStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  const [sorter, setSorter] = useState({ rule: 'createTime', order: '0' });
  const [pagination, setPagination] = useState({ size: 10, total: 0, current: 1 });

  // selector
  const [relatedResources, setRelatedResources] = useState<any[]>([generatorDefaultAll()]); // 关联资源-下拉选-options
  const [kgList, setKgList] = useState<any[]>([generatorDefaultAll()]); // 资源-浮层-下拉选-知识网络-options
  const [dbSourceList, setDbSourceList] = useState<any[]>([generatorDefaultAll()]); // 资源-浮层-下拉选-数据源-options

  // selector-select-value
  const [relResourcesSelectorValue, setRelResourcesSelectorValue] = useState('-1'); // 关联资源-选中值
  const [selectorKnId, setSelectorKnId] = useState('-1'); // 浮层-知识网络id
  const [selectorDbSourceId, setselectorDbSourceId] = useState('-1'); // 浮层-数据源id
  const [hoverRow, setHoverRow] = useState(null);

  const clearFilterToSearch = () => {
    setselectorDbSourceId('-1');
    setSelectorKnId('-1');
    setRelResourcesSelectorValue('-1');
    setKeyword('');
    setSearchStatus('');

    reSearch();
  };

  /**
   * 新建认知服务
   */
  const onCreate = () => {
    history.push('/dpapi?action=create');
  };

  const onSearch = (queryStr: string) => {
    _.debounce(query => {
      setKeyword(query);
    }, 300)(queryStr);
  };

  const onStatusChange = (key: string) => {
    if (key === '-1') {
      setSearchStatus('');
    } else {
      setSearchStatus(key);
    }
  };

  const getKnNameById = (id: string) => {
    const find = kgList.filter(item => {
      return String(id) === String(item.id);
    });
    let resKnName = '';
    if (find && find.length && find.length > 0) {
      resKnName = find[0]?.text;
    }
    return resKnName;
  };

  const setRelResourceSelectorValue = (knId: string, dsId: string) => {
    const findSelectorKnIdItem: any[] = kgList.filter(item => item.id === knId);
    const findSelectorDbSourceItem: any[] = dbSourceList.filter(item => item.id === dsId);
    if (knId === '-1' && dsId === '-1') {
      // 不新增option 选中全部
      setRelResourcesSelectorValue('-1');
    } else {
      //
      const newSelectStatus = {
        id: `${knId}_${dsId}`, // 数据源ID
        text: `${findSelectorKnIdItem[0].text}-${findSelectorDbSourceItem[0].text}` // 知识网络-数据源
      };
      setRelatedResources([generatorDefaultAll(), newSelectStatus]);
      setRelResourcesSelectorValue(newSelectStatus.id);
    }
  };

  const onKnUserSelectorChange = async (key: string) => {
    // 触发 数据源更新
    setSelectorKnId(key);
    // 先清空在设置
    setDbSourceList([generatorDefaultAll()]);
    if (key === '-1') {
      // 浮层数据源默认选中 【全部】
      setselectorDbSourceId('-1');
      await getDataSource(Number('-1'));
    } else {
      setselectorDbSourceId('-1');
      await getDataSource(Number(key));
    }
    setRelResourceSelectorValue(key, '-1');
  };
  const onDbSelectorChange = (key: string) => {
    setselectorDbSourceId(key);
    setRelResourceSelectorValue(selectorKnId, key);
  };

  /**
   * 点击排序按钮
   */
  const onSortMenuClick = (key: string) => {
    if (key === sorter.rule) {
      if (sorter.order === '1') {
        setSorter({ rule: key, order: '0' });
      } else {
        setSorter({ rule: key, order: '1' });
      }
    } else {
      setSorter({ rule: key, order: '1' });
    }
  };

  const onEditRecord = (record: any) => {
    history.push(`/dpapi?id=${record.id}&action=edit&kwId=${record.knwId}`);
  };
  const onUnPublishRecord = async (record: any) => {
    const title = intl.get('dpapiList.unPublishService');
    const content = intl.get('dpapiList.unPublishDes');
    const isOk = await tipModalFunc({ title, content, closable: false });
    onDeleteCancel(isOk, 'cancelPublish', record);
  };
  const onPublishRecord = (record: any) => {
    history.push(`/dpapi?id=${record.id}&action=publish&kwId=${record.knwId}`);
  };
  const onDeleteRecord = async (record: any) => {
    const title = intl.get('dpapiList.deleteService');
    const content = intl.get('dpapiList.retrieved');
    const isOk = await tipModalFunc({ title, content, closable: false });
    onDeleteCancel(isOk, 'delete', record);
  };

  const onDeleteCancel = async (isOk: any, type: any, record?: any, ids?: Array<string>) => {
    if (!isOk) return;
    try {
      if (type === 'delete') {
        const res: any = await servicesDpapi.DBApiRemove({ idList: [record.id] });
        if (res.code === '200') {
          message.success(intl.get('dpapiList.deleteSuccess'));
        } else {
          message.error(res.message || 'Error');
        }
      }
      if (type === 'cancelPublish') {
        const res: any = await servicesDpapi.DBApiUnpublish({
          id: record.id,
          userName: localStore.get('userInfo').username || '',
          userId: localStore.get('userInfo').id || ''
        });
        if (res.code === '200') {
          message.success(intl.get('dpapiList.unPublishSuccess'));
        } else {
          message.error(res.message || 'Error');
        }
      }
      if (type === 'multiDelete') {
        const res: any = await servicesDpapi.DBApiRemove({ idList: ids });
        if (res.code === '200') {
          message.success(intl.get('dpapiList.deleteSuccess'));
        } else {
          message.error(res.message || 'Error');
        }
      }
      reSearch();
    } catch (err) {
      const { Description, ErrorCode } = err.response || err.data || {};
      if (ErrorCode === 'Cognitive.ServicePermissionDeniedErr') return message.error(intl.get('license.serAuthError'));
      Description && message.error(Description);
    }
  };

  /**
   *获取列表数据
   */
  const getData = async (page: number, size: number) => {
    setLoading(true);

    const orderField: string = SORTED_FIELD_MAP_CODE[sorter.rule];
    const data = {
      name: keyword,
      status: searchStatus,
      orderRule: [
        {
          orderField,
          orderType: sorter.order === '0' ? 'desc' : 'asc'
        }
      ],
      userName: localStore.get('userInfo').username || '',
      userId: localStore.get('userInfo').id || '',
      knwId: selectorKnId === '-1' ? '' : selectorKnId,
      datasourceId: selectorDbSourceId === '-1' ? '' : selectorDbSourceId,
      pageSize: size,
      pageNum: page
    };
    const res: any = await servicesDpapi.DBApiList(data);
    if (res.code === '200') {
      setTableData(res?.rows);
      setPagination({
        current: page,
        size,
        total: res?.total
      });
    } else {
      message.error(res.message || 'Error');
    }
    setLoading(false);
  };

  /**
   * 当前页面变化
   */
  const currentChange = (page: number) => {
    setPagination({
      total: pagination.total,
      size: pagination.size,
      current: page
    });
    getData(page, pagination.size);
  };

  /**
   * 表格排序
   */
  const sortOrderChange = (pagination: any, filters: any, sorterParams: any) => {
    let order = '';
    // eslint-disable-next-line default-case
    switch (sorterParams.order) {
      case '':
        order = '';
        break;
      case 'ascend':
        order = '1';
        break;
      case 'descend':
        order = '0';
        break;
    }
    const rule = sorterParams.field;
    if (!(sorter.rule === rule && sorter.order === order)) {
      setSorter({ rule, order });
    }
  };

  const reSearch = async () => {
    getData(1, 10);
  };

  const toDocApiPage = (record: any) => {
    const id = record.id;
    window.open(`/cognitive/rest-dbapi?service_id=${id}`);
  };

  const columns: any = [
    {
      title: intl.get('dpapiList.serviceName'),
      dataIndex: 'name',
      width: 296,
      sorter: true,
      ellipsis: true,
      defaultSortOrder: '',
      sortOrder: sorter.rule === 'name' ? (sorter.order === '1' ? ASC : DESC) : null,
      sortDirections: [ASC, DESC, ASC]
    },
    {
      title: intl.get('dpapiList.option'),
      key: 'action',
      width: 76,
      // fixed: 'left',
      // renderConfig:{},
      render: (text: any, record: any) => (
        <Dropdown
          overlay={
            <Menu
              style={{ width: 120 }}
              onClick={e => {
                switch (e.key) {
                  case 'edit':
                    onEditRecord(record);
                    break;
                  case 'unpublish':
                    onUnPublishRecord(record);
                    break;
                  case 'publish':
                    onPublishRecord(record);
                    break;
                  case 'delete':
                    onDeleteRecord(record);
                    break;
                }
              }}
            >
              <Menu.Item key="edit" style={{ height: 40 }} disabled={record.status === 'PUBLISHED'}>
                {intl.get('dpapiList.edit')}
              </Menu.Item>
              {record.status === 'PUBLISHED' ? (
                <Menu.Item key="unpublish" style={{ height: 40 }} onClick={() => {}}>
                  {intl.get('dpapiList.cancelPublishApi')}
                </Menu.Item>
              ) : (
                <Menu.Item key="publish" style={{ height: 40 }} onClick={() => {}}>
                  {intl.get('dpapiList.publish')}
                </Menu.Item>
              )}
              <Menu.Item
                key="delete"
                style={{ height: 40 }}
                onClick={() => {}}
                disabled={record.status === 'PUBLISHED'}
              >
                {intl.get('dpapiList.delete')}
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
          placement="bottomLeft"
          // getPopupContainer={triggerNode => triggerNode?.parentElement?.parentElement || document.body}
        >
          <Format.Button onClick={event => event.stopPropagation()} className="kw-table-operate" type="icon">
            <EllipsisOutlined style={{ fontSize: 20 }} />
          </Format.Button>
        </Dropdown>
      )
    },
    {
      title: intl.get('dpapiList.serviceStatus'),
      dataIndex: 'status',
      ellipsis: true,
      width: 120,
      render: (text: any, record: any) => {
        const { status } = record;
        let showStatus = '';
        // eslint-disable-next-line default-case
        switch (status) {
          case 'PUBLISHED':
            showStatus = intl.get('dpapiList.Published');
            break;
          case 'UNPUBLISHED':
            showStatus = intl.get('dpapiList.Unpublished');
            break;
        }
        return (
          <div className="kw-flex table-status">
            <div className="status-color kw-mr-2" style={{ background: STATUS_COLOR[status] }}>
              {' '}
            </div>
            <span> {showStatus}</span>
          </div>
        );
      }
    },
    {
      title: intl.get('dpapiList.serviceDoc'),
      width: 148,
      render: (text: any, record: any) => {
        return (
          <div className="kw-pointer api-view kw-c-primary" onClick={() => toDocApiPage(record)}>
            <span>{intl.get('dpapiList.apiNote')}</span>
            <IconFont type="icon-zhuanfa_xiantiao" className="kw-ml-1" style={{ fontSize: '16px' }} />
          </div>
        );
      }
    },
    {
      title: intl.get('dpapiList.serviceId'),
      dataIndex: 'id',
      // ellipsis: true,
      width: 336,
      render: (text: any, record: any) => {
        return (
          <div
            onMouseEnter={() => {
              setHoverRow(record);
            }}
            onMouseLeave={() => {
              setHoverRow(null);
            }}
          >
            <span>
              {text}&nbsp;
              {/* @ts-ignore */}
              {hoverRow && hoverRow.id === record.id ? (
                <Space>
                  <CopyToClipboard text={text}>
                    <span
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        message.success(intl.get('exploreAnalysis.copySuccess'));
                      }}
                    >
                      <IconFont type="icon-copy" />
                    </span>
                  </CopyToClipboard>
                </Space>
              ) : (
                <span></span>
              )}
            </span>
          </div>
        );
      }
    },
    {
      title: intl.get('dpapiList.datasourceName'),
      width: 192,
      ellipsis: true,
      dataIndex: 'datasourceName',
      render: (text: any, record: any) => {
        return (
          <span>
            {getKnNameById(record.knwId)}-{record.datasourceName}
          </span>
        );
      }
    },
    {
      title: intl.get('dpapiList.createdBy'),
      width: 170,
      ellipsis: true,
      dataIndex: 'createBy'
    },
    {
      title: intl.get('dpapiList.createdTime'),
      dataIndex: 'createTime',
      width: 170,
      ellipsis: true,
      sorter: true,
      sortOrder: sorter.rule === 'createTime' ? (sorter.order === '1' ? ASC : DESC) : null,
      defaultSortOrder: DESC,
      sortDirections: [ASC, DESC, ASC]
    },
    {
      title: intl.get('dpapiList.modifyBy'),
      width: 170,
      ellipsis: true,
      dataIndex: 'updateBy'
    },
    {
      title: intl.get('dpapiList.modifyTime'),
      width: 170,
      dataIndex: 'updateTime',
      ellipsis: true,
      sorter: true,
      sortOrder: sorter.rule === 'updateTime' ? (sorter.order === '1' ? ASC : DESC) : null,
      defaultSortOrder: '',
      sortDirections: [ASC, DESC, ASC]
    }
  ];

  const getKnowledgeList = async () => {
    const data = { page: 1, size: 10000, order: 'desc', rule: 'update' };
    try {
      const result = await servicesKnowledgeNetwork.knowledgeNetGet(data);
      if (result?.res?.df && result?.res?.df?.length > 0) {
        // @ts-ignore
        const items: any = result?.res?.df || [];
        const tmp: any[] = [generatorDefaultAll()].concat(
          items.map((item: any) => {
            return {
              id: item.id,
              text: item.knw_name,
              color: item?.color
            };
          })
        );
        setKgList(tmp);
      }
    } catch (error) {}
  };

  const getDataSource = async (currentKnId = -1) => {
    const id = Number(currentKnId);
    setDbSourceList([generatorDefaultAll()]);
    try {
      // @ts-ignore
      const { res } = await servicesDataSource.dataSourceGet(-1, 10, 'descend', id, 'mysql');
      // 过滤数据源== mysql 后的结果
      const filterDf = _.filter(res?.df, item => _.includes(DATA_SOURCE, item?.data_source));
      const tmp: any[] = [generatorDefaultAll()].concat(
        filterDf.map((item: any) => {
          return {
            id: item.id,
            text: item.dsname,
            data_source: item.data_source,
            ds_address: item.ds_address
          };
        })
      );
      setDbSourceList(tmp);
      setselectorDbSourceId('-1');
    } catch (err) {
      //
    }
  };

  useEffect(() => {
    getKnowledgeList();
    getDataSource(Number('-1'));
  }, []);

  useEffect(() => {
    if (kgList.length === 0) return;
    reSearch();
  }, [sorter, keyword, searchStatus, relResourcesSelectorValue]);

  const isSearching = () =>
    keyword !== '' || searchStatus !== '' || selectorKnId !== '-1' || selectorDbSourceId !== '-1';

  return (
    <div className="dbapi-container">
      <KwTable
        className="dbapi-table"
        // width={1000}
        title={intl.get('dpapiList.apiManager')}
        showHeader={true}
        showFilter={true}
        searchPlaceholder={intl.get('dpapiList.search')}
        onSearchChange={(e: any) => {
          onSearch(e);
        }}
        // searchPlaceholder="123"
        // localeImage={empty}
        // localeText="123"
        onRow={(record, index) => {
          return {
            onContextMenu: e => {
              e.preventDefault();
            }
          };
        }}
        onHeaderRow={(columns, index) => {
          return {
            onContextMenu: e => {
              e.preventDefault();
            }
          };
        }}
        onFilterClick={(e: any, status: any) => {}}
        filterToolsOptions={[
          {
            id: 199,
            label: intl.get('dpapiList.state'),
            itemDom: (
              <div>
                <Select
                  defaultValue={searchStatus === '' ? '-1' : searchStatus}
                  key={searchStatus.length ? searchStatus : Date.now()}
                  onChange={onStatusChange}
                  style={{ width: '200px' }}
                  options={FILTER_OPTION.map(item => ({ label: item.text, value: item.key }))}
                ></Select>
              </div>
            )
          },
          {
            id: 2,
            label: intl.get('dpapiList.datasourceName'),
            itemDom: (
              <div>
                <Select
                  defaultValue={'-1'}
                  value={relResourcesSelectorValue}
                  style={{ width: '200px' }}
                  options={relatedResources.map(item => ({ label: item.text, value: item.id }))}
                  dropdownMatchSelectWidth={language === 'en-US' ? 380 : 312}
                  dropdownRender={menu => (
                    <>
                      <div className="relResourcePopoverRow">
                        <span className={`myLabel ${language === 'en-US' ? 'enUs' : ''}`}>
                          {intl.get('dpapiList.kn')}
                        </span>
                        <Select
                          defaultValue={'-1'}
                          value={selectorKnId}
                          onChange={onKnUserSelectorChange}
                          style={{ width: '200px' }}
                        >
                          {kgList.map(item => (
                            <Select.Option key={item?.id} value={item?.id}>
                              <div className="myOptionItem">
                                {/* <IconFont type="icon-color-renzhiyingyong" className="labelItem" /> */}
                                <KwKNIcon type={item?.color} />
                                <span className="valueItem" style={{ marginLeft: 8 }}>
                                  {item?.text}
                                </span>
                              </div>
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                      <div className="relResourcePopoverRow">
                        <span className={`myLabel ${language === 'en-US' ? 'enUs' : ''}`}>
                          {intl.get('dpapiList.db')}
                        </span>
                        <Select
                          // getPopupContainer={trigger => trigger.parentElement}
                          defaultValue={'-1'}
                          value={selectorDbSourceId}
                          onChange={onDbSelectorChange}
                          style={{ width: '200px' }}
                        >
                          {dbSourceList.map(item => (
                            <Select.Option key={item?.id} value={item?.id}>
                              <div className="myOptionItem">
                                <img className="labelItem" src={mysqlImg} style={{ height: 14, width: 14 }} />
                                <span className="valueItem" style={{ marginLeft: 8 }}>
                                  {item?.text}
                                </span>
                              </div>
                            </Select.Option>
                          ))}
                        </Select>
                      </div>
                    </>
                  )}
                />
              </div>
            )
          }
        ]}
        renderButtonConfig={[
          {
            key: 'left01',
            position: 'left',
            itemDom: (
              <>
                <Button type="primary" style={{ marginRight: 12 }} onClick={onCreate}>
                  <IconFont type="icon-Add" style={{ color: '#fff' }} />
                  {intl.get('dpapiList.create')}
                </Button>
              </>
            )
          },
          {
            key: 'right01',
            position: 'right',
            itemDom: (
              <div>
                <Dropdown
                  placement="bottomRight"
                  overlay={
                    <Menu selectedKeys={[sorter.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                      {SORTER_FIELD.map(({ key, text }) => (
                        <Menu.Item key={key}>
                          <ArrowDownOutlined
                            className="kw-mr-2"
                            rotate={sorter.order === '0' ? 0 : 180}
                            style={{ opacity: sorter.rule === key ? 0.8 : 0, fontSize: 15 }}
                          />
                          {text}
                        </Menu.Item>
                      ))}
                    </Menu>
                  }
                >
                  <div className="filterItem">
                    <Button className="kw-ml-0 tool-btn" type="text">
                      <IconFont type="icon-paixu11" className="sort-icon" style={{ fontSize: 16 }} />
                    </Button>
                  </div>
                </Dropdown>
              </div>
            )
          },
          {
            key: 'right02',
            position: 'right',
            itemDom: (
              <div className="filterItem">
                <Button
                  className="kw-ml-0 tool-btn"
                  title={intl.get('global.refresh')}
                  onClick={() => {
                    reSearch();
                  }}
                  type="text"
                >
                  <IconFont type="icon-tongyishuaxin" style={{ fontSize: 16 }} />
                </Button>
              </div>
            )
          }
        ]}
        onFiltersToolsClose={() => clearFilterToSearch()}
        // scroll={{ x: 500, y: 100 }}
        // rowSelection={{
        //   type: 'checkbox'
        // }}
        columns={columns}
        lastColWidth={180}
        scroll={{ x: '100%' }}
        dataSource={tableData}
        onChange={sortOrderChange}
        loading={loading ? { indicator } : false}
        pagination={{
          total: pagination.total,
          current: pagination.current,
          pageSize: pagination.size,
          showSizeChanger: false,
          onChange: currentChange,
          showTotal: total => intl.get('configSys.total', { total })
        }}
        emptyImage={isSearching() ? noResImg : createImg}
        emptyText={
          isSearching() ? (
            intl.get('global.noResult')
          ) : (
            <ContainerIsVisible
              placeholder={<div className="kw-c-text">{intl.get('dpapiList.noContent')}</div>}
              isVisible={true}
            >
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
  );
};

export default DBApi;
