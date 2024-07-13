/* eslint-disable max-lines */
import _ from 'lodash';
import intl from 'react-intl-universal';
import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Dropdown, Menu, Tag, message } from 'antd';
import {
  LoadingOutlined,
  ArrowDownOutlined,
  CaretDownOutlined,
  DownOutlined,
  EllipsisOutlined
} from '@ant-design/icons';
import Format from '@/components/Format';
import IconFont from '@/components/IconFont';
import SearchInput from '@/components/SearchInput';
import { tipModalFunc } from '@/components/TipModal';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import Hooks from '@/hooks';
import servicesCreateEntity from '@/services/createEntity';

import HELPER from '@/utils/helper';
import { GRAPH_DB_TYPE } from '@/enums';

import noResult from '@/assets/images/noResult.svg';
import knowledgeEmpty from '@/assets/images/kgEmpty.svg';
import AddContent from '@/assets/images/create.svg';

import './style.less';
import ModalOntoImport from './ModalOntoImport';
import OntoLibG6 from './OntoCanvas';
import servicesPermission from '@/services/rbacPermission';
import SaveOntologyModal, { SaveOntoDataType, SaveOntoModalRef } from './OntoCanvas/OntoG6/OntoFooter/SaveOntoModal';
import { OntoApiDataType } from './OntoCanvas/OntoG6/types/data';
import KwTable from '@/components/KwTable';
import { sessionStore } from '@/utils/handleFunction';
import useLatestState from '@/hooks/useLatestState';

const { useRouteCache, useAdHistory } = Hooks;
const antIcon = <LoadingOutlined style={{ fontSize: 14 }} spin />;
const antIconBig = <LoadingOutlined style={{ fontSize: 24, top: '200px' }} spin />;

// 排序(名称、创建时间、最终操作时间)
const SORTER_KEYS = [
  { key: 'name', text: intl.get('ontoLib.sortByName') },
  { key: 'create', text: intl.get('ontoLib.sortByCreateTime') },
  { key: 'update', text: intl.get('ontoLib.sortByFinalOpTime') }
];

enum CANVAS_OP_TYPE {
  CREATE = 'create',
  EDIT = 'edit',
  COPY = 'copy',
  IMPORT = 'import',
  VIEW = 'view'
}

const SORTER_MAP: Record<string, string> = {
  descend: 'desc',
  desc: 'descend',
  ascend: 'asc',
  asc: 'ascend',
  ontology_name: 'name',
  name: 'ontology_name',
  create_time: 'create',
  create: 'create_time',
  update_time: 'update',
  update: 'update_time'
};

const sorterConvert = (key: string) => SORTER_MAP[key] || key;

// 新建下拉列表(新建、导入)
const CREATE_IMPORT_MENU = [
  {
    id: 'add',
    icon: 'icon-Add',
    intlText: 'ontoLib.createOnto'
  },
  {
    id: 'import',
    icon: 'icon-daoru',
    intlText: 'ontoLib.importOnto'
  }
];

// 导出下拉列表
const EXPORT_MENU = (record?: any) => [
  {
    id: 'xlsx',
    intlText: 'ontoLib.exportXlsx',
    disable: !record.saved
  },
  {
    id: 'json',
    intlText: 'ontoLib.exportJson',
    disable: !record.saved
  }
];

const pageSize = 10;
const OntoLib = (props: any) => {
  const { knData } = props;
  const [routeCache, setRouteCache] = useRouteCache<any>();
  const target = `${window.location.pathname}${window.location.search}`;
  const history = useAdHistory(); // 路由
  const [tableData, setTableData] = useState<any[]>([]); // 表格渲染数据
  const [sorter, setSorter, getSorter] = useLatestState({
    rule: routeCache.filterRule ?? 'create',
    order: routeCache.filterOrder ?? 'desc'
  }); // 排序字段 & 排序顺序(升、降)
  const [currentSelected, setCurrentSelected] = useState(1); // 当前选中页码
  const [searchValue, setSearchValue] = useState(''); // 搜索关键字
  const [current, setCurrent, getCurrent] = useLatestState(routeCache.page ?? 1); // 当前页码
  const [total, setTotal] = useState(0); // 数据总数
  const [selectedRowKeys, setSelectedRowKeys, getSelectedRowKeys] = useLatestState<any[]>(
    routeCache.tableSelectedKey ?? []
  ); // 多选框选中的数据的key
  const [selectedRowsList, setSelectedRowsList] = useState<any>([]); // 多选框选中的数据

  const [authOntoData, setAuthOntoData] = useState<any>(null); // 权限管理的record
  const [loading, setLoading] = useState(false);
  const [isVisibleImport, setIsVisibleImport] = useState<any>(false);
  const [isVisibleModalFeedback, setIsVisibleModalFeedback] = useState<any>(false);

  const [dbType, setDbType] = useState('');
  const [osId, setOsId] = useState(0); // 图数据库绑定的openserch id
  const [ontoData, setOntoData] = useState(); // 本体
  const [graphId, setGraphId] = useState('');
  const [ontologyId, setOntologyId] = useState(0); // 本体id
  const [canvasCurrent, setCanvasCurrent] = useState(0); // 当前页码
  const [canShowCanvas, setCanShowCanvas] = useState(false); // 是否显示画布
  const [ontoLibType, setOntoLibType] = useState(''); // 画布的type是新建还是编辑
  const [ontoLibData, setOntoLibData] = useState<SaveOntoDataType>({
    ontologyName: '',
    domainArray: [],
    ontologyDescribe: ''
  });
  const [defaultParsingRule, setDefaultParsingRule] = useState({ delimiter: ',', quotechar: '"', escapechar: '"' }); // 默认解析规则
  const [sourceFileType, setSourceFileType] = useState('csv');
  const [parsingTreeChange, setParsingTreeChange] = useState([]); // 未保存时解析规则变化

  // 更多下拉列表
  const MORE_MENU = (record?: any) => [
    // {
    //   id: 'view',
    //   intlText: 'ontoLib.viewOnto'
    // },
    {
      id: 'copy',
      intlText: 'ontoLib.copy'
    },
    {
      id: 'delete',
      intlText: 'ontoLib.delete'
    },
    {
      id: 'management',
      intlText: 'ontoLib.authManagement',
      disable: record.is_temp && !record.saved
    }
  ];

  const showQuitTip = useRef(false);

  const [showSaveOntologyModal, setShowSaveOntologyModal] = useState(false); // 是否显示保存本体modal
  const copyDetail = useRef<any>(null); // 复制操作ref
  const saveOntoRef = useRef<SaveOntoModalRef>(null); // 保存本体ref

  const closeSaveOntologyModal = () => {
    setShowSaveOntologyModal(false);
  };
  const modalOkSave = async () => {
    let newEntity;
    let newEdge;
    let canvasConfig;
    if (ontoLibType === CANVAS_OP_TYPE.COPY) {
      const { res } = await servicesCreateEntity.getEntityInfo(copyDetail.current.otl_id);
      newEntity = res.otl_temp.length ? res.otl_temp[0].entity : res.entity;
      newEdge = res.otl_temp.length ? res.otl_temp[0].edge : res.edge;
      canvasConfig = res.canvas;
    }
    const summaryData: OntoApiDataType = {
      ontology_name: saveOntoRef.current?.dataSummary.current?.ontologyName || '',
      ontology_des: saveOntoRef.current?.dataSummary.current?.ontologyDescribe,
      domain: saveOntoRef.current?.dataSummary.current?.domainArray,
      knw_id: knData.id,
      entity: ontoLibType === CANVAS_OP_TYPE.COPY ? newEntity : [],
      edge: ontoLibType === CANVAS_OP_TYPE.COPY ? newEdge : [],
      used_task: [],
      temp_save: true,
      canvas:
        ontoLibType === CANVAS_OP_TYPE.COPY ? canvasConfig : { background_color: 'white', background_image: 'point' }
    };
    const response = await servicesCreateEntity.addEntity(summaryData);
    if (response.res) {
      setOntoLibData({
        ontologyName: saveOntoRef.current?.dataSummary.current?.ontologyName || '',
        domainArray: saveOntoRef.current?.dataSummary.current?.domainArray || [],
        ontologyDescribe: saveOntoRef.current?.dataSummary.current?.ontologyDescribe || ''
      });
      setTimeout(() => {
        (async () => {
          const { res } = await servicesCreateEntity.getEntityInfo(response.res.ontology_id);
          setShowSaveOntologyModal(false);
          setOntoData(res);
          setCanvasCurrent(2);
          setCanShowCanvas(true);
        })();
      }, 250);
    } else if (response.Description) {
      if (saveOntoRef.current) {
        saveOntoRef.current!.formDetailError.current = response.ErrorDetails;
      }
      saveOntoRef.current?.form.validateFields();
      // message.error(response.ErrorDetails);
    }
  };

  const fetchOntoList = async (page: number, sorter: Record<string, string>, search?: string, filterValue?: string) => {
    if (!knData.id) return;
    setLoading(true);
    const OntologyData = {
      knw_id: knData.id,
      page,
      size: pageSize,
      rule: sorter.rule,
      order: sorter.order,
      search,
      filter: filterValue
    };
    const { filter, ...importData } = OntologyData;
    const { res } = (await servicesCreateEntity.getAllNoumenon(filter ? OntologyData : importData)) || [];
    setLoading(false);
    setTableData(res?.otls || []);
    setTotal(res?.count);
  };

  useEffect(() => {
    fetchOntoList(current, sorter, searchValue);
  }, [JSON.stringify(knData)]);

  useEffect(() => {
    if (_.isEmpty(tableData)) {
      setTableData([]);
      return;
    }
    const dataIds = _.map(tableData, item => String(item?.otl_id));
    // servicesPermission.dataPermission(postData).then(result => {
    //   const codesData = _.keyBy(result?.res, 'dataId');
    //   const newTableData = _.map(tableData, item => {
    //     item.__codes = codesData?.[item.otl_id]?.codes;
    //     return item;
    //   });
    //   setTableData(newTableData);
    // });
    setTableData(tableData);
  }, [JSON.stringify(tableData)]);

  useEffect(() => {
    fetchOntoList(current, sorter, searchValue);
  }, [sorter, current, searchValue]);

  const columns: any = [
    {
      title: intl.get('ontoLib.ontoName'),
      dataIndex: 'ontology_name',
      ellipsis: true,
      sorter: true,
      fixed: true,
      width: 296,
      render: (text: string, record: any) => {
        return (
          // <div className="ontology-name-box" onClick={() => onEdit(record)}>
          <div className="ontology-name-box">
            <div
              className={`name-${record.is_temp} kw-ellipsis`}
              title={record.ontology_name}
              onClick={() => viewOntoTempFunc(record)}
            >
              {record.ontology_name}
            </div>
            <div className="desc kw-ellipsis" title={record.ontology_des}>
              {record.ontology_des || <span className="kw-c-watermark">{intl.get('global.notDes')}</span>}
            </div>
          </div>
        );
      },
      sortOrder: sorter.rule === 'name' && sorterConvert(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      showSorterTooltip: false
    },
    {
      title: intl.get('ontoLib.operation'),
      dataIndex: 'operation',
      fixed: true,
      width: 76,
      render: (_: any, record: any) => {
        return (
          <Dropdown
            trigger={['click']}
            overlay={
              <Menu>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    viewOntoFunc(record);
                  }}
                >
                  {intl.get('ontoLib.viewOnto')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onEdit(record);
                  }}
                >
                  {intl.get('ontoLib.edit')}
                </Menu.Item>

                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onCopy(record);
                  }}
                >
                  {intl.get('ontoLib.copy')}
                </Menu.Item>
                <Menu.Item
                  disabled={!record.saved}
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    exportEntityFunc(record, 'xlsx');
                  }}
                >
                  {intl.get('ontoLib.exportXlsx')}
                </Menu.Item>
                <Menu.Item
                  disabled={!record.saved}
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    exportEntityFunc(record, 'json');
                  }}
                >
                  {intl.get('ontoLib.exportJson')}
                </Menu.Item>
                <Menu.Item
                  onClick={({ domEvent }) => {
                    domEvent.stopPropagation();
                    onDeleteAction(record);
                  }}
                >
                  {intl.get('ontoLib.delete')}
                </Menu.Item>
                {/* 
                  <Menu.Item
                    // disabled={record.is_temp && !record.saved}
                    onClick={({ domEvent }) => {
                      domEvent.stopPropagation();
                      setRouteCache({
                        tableSelectedKey: getSelectedRowKeys(),
                        page: getCurrent(),
                        filterRule: getSorter().rule,
                        filterOrder: getSorter().order
                      });
                      history.push(`/knowledge/otl-auth?otl_id=${record.otl_id}&ontology_name=${record.ontology_name}`);
                    }}
                  >
                    {intl.get('ontoLib.authManagement')}
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
      title: intl.get('ontoLib.status'),
      dataIndex: 'entity_status',
      ellipsis: true,
      // width: 186,
      render: (text: string, record: any) => {
        return (
          <div className="status-box">
            <div
              className={
                record.is_temp && record.saved
                  ? 'circle-unpublished'
                  : record.is_temp && !record.saved
                  ? 'circle-draft'
                  : 'circle-published'
              }
            ></div>
            <div className="status-text">
              {record.is_temp && record.saved
                ? intl.get('ontoLib.status_unpublished')
                : record.is_temp && !record.saved
                ? intl.get('ontoLib.status_draft')
                : intl.get('ontoLib.status_published')}
            </div>
          </div>
        );
      }
    },
    {
      title: intl.get('ontoLib.domain'),
      dataIndex: 'domain',
      ellipsis: true,
      // width: 144,
      render: (text: string, record: any) => {
        return (
          <div className="domain kw-ellipsis" title={record.domain.length ? record.domain.join(',') : '- -'}>
            {record.domain.length ? record.domain.join(',') : '- -'}
          </div>
        );
      }
    },
    {
      title: intl.get('ontoLib.entityNum'),
      dataIndex: 'entity_num',
      ellipsis: true
      // width: 106
    },
    {
      title: intl.get('ontoLib.edgeNum'),
      dataIndex: 'edge_num',
      ellipsis: true
      // width: 150
    },
    {
      title: intl.get('ontoLib.creator'),
      dataIndex: 'create_user_name',
      ellipsis: true
      // width: 96
    },
    {
      title: intl.get('ontoLib.createTime'),
      dataIndex: 'create_time',
      ellipsis: true,
      // width: 192,
      sorter: true,
      sortOrder: sorter.rule === 'create' && sorterConvert(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      showSorterTooltip: false
    },
    {
      title: intl.get('ontoLib.finalOperator'),
      dataIndex: 'update_user_name',
      ellipsis: true
      // width: 150
    },
    {
      title: intl.get('ontoLib.finalOperateTime'),
      dataIndex: 'update_time',
      ellipsis: true,
      // width: 192,
      sorter: true,
      defaultSortOrder: 'descend',
      sortOrder: sorter.rule === 'update' && sorterConvert(sorter.order),
      sortDirections: ['ascend', 'descend', 'ascend'],
      showSorterTooltip: false
    }
  ];

  /**
   * 多选框
   */
  const selectedRowKeysChange = (rowKeys: any, rowsData: any) => {
    setSelectedRowsList(rowsData);
    setSelectedRowKeys(rowKeys);
  };

  /**
   * 页码切换
   */
  const currentChange = async (page: any) => {
    setCurrent(page);
  };

  const viewOntoFunc = async (record: any) => {
    // 预览只展示正式版本
    setOntoLibData({
      ontologyName: record.ontology_name,
      domainArray: record.domain,
      ontologyDescribe: record.ontology_des
    });
    setOntoLibType(CANVAS_OP_TYPE.VIEW);
    const { res } = (await servicesCreateEntity.getEntityInfo(record.otl_id)) || [];
    setOntoData(res);
    setCanvasCurrent(2);
    setCanShowCanvas(true);
  };

  const viewOntoTempFunc = async (record: any) => {
    // 预览只展示正式版本
    setOntoLibData({
      ontologyName: record.ontology_name,
      domainArray: record.domain,
      ontologyDescribe: record.ontology_des
    });
    setOntoLibType(CANVAS_OP_TYPE.VIEW);
    const { res } = (await servicesCreateEntity.getEntityInfo(record.otl_id)) || [];
    const data = res.otl_temp?.length ? res.otl_temp[0] : res;
    setOntoData(data);
    setCanvasCurrent(2);
    setCanShowCanvas(true);
  };

  const onEdit = async (record: any) => {
    // 编辑优先采用草稿，如果没有草稿则编辑正式版本
    setOntoLibData({
      ontologyName: record.ontology_name,
      domainArray: record.domain,
      ontologyDescribe: record.ontology_des
    });
    setOntoLibType(CANVAS_OP_TYPE.EDIT);
    const { res } = await servicesCreateEntity.getEntityInfo(record.otl_id);
    setOntoData(res);
    setCanvasCurrent(2);
    setCanShowCanvas(true);
  };

  const getOtls = async () => {
    const OntologyData = {
      knw_id: knData.id,
      page: -1,
      size: 10,
      rule: 'update',
      order: 'desc',
      search: '',
      filter: ''
    };
    const { filter, ...importData } = OntologyData;
    const { res } = (await servicesCreateEntity.getAllNoumenon(filter ? OntologyData : importData)) || [];
    if (res.count) {
      return res.otls;
    }
  };

  const getCopyName = (name: string, otlsArr: any): any => {
    const filterArr = _.filter(otlsArr, otl => otl.ontology_name === name);
    if (filterArr.length) {
      return getCopyName(name + intl.get('ontoLib.areCopy'), otlsArr);
    }
    return name;
  };

  const onCopy = async (record: any) => {
    const dataArr = await getOtls();
    const copyedName = getCopyName(`${record.ontology_name}` + intl.get('ontoLib.areCopy'), dataArr);
    copyDetail.current = { ...record, ontology_name: copyedName };
    setOntoLibType(CANVAS_OP_TYPE.COPY);
    setShowSaveOntologyModal(true);

    // 复制优先采用草稿，如果没有草稿则采用正式版本
    // setOntoLibData({
    //   ontologyName: record.ontology_name,
    //   domainArray: record.domain,
    //   ontologyDescribe: record.ontology_des
    // });
    // setOntoLibType(CANVAS_OP_TYPE.COPY);
    // const { res } = (await servicesCreateEntity.getEntityInfo(record.otl_id)) || [];
    // setOntoData(res);
    // setCanvasCurrent(2);
    // setCanShowCanvas(true);
  };

  const onDeleteAction = (record: any) => {
    onDelete(record);
  };

  const openModalImport = () => setIsVisibleImport(true);
  const closeModalImport = () => setIsVisibleImport(false);

  /**
   * 获取导入反馈，关闭导入弹窗
   */
  const closeModalFeedback = (res: any) => {
    if (res.task_status !== 'finished') {
      // message.error(res?.result);
      message.error({
        content: res?.result,
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
    } else {
      try {
        closeModalImport();
        // 无法解析换行，暂时去除
        const onto = JSON.parse(_.replace(res.result, /\n/g, ''));
        const { entity } = onto;
        entity.forEach((entityItem: any) => {
          entityItem.properties_index = Array.from(
            new Set([...entityItem.properties_index, ...entityItem.vector_generation])
          );
        });
        setOntoLibData({
          ontologyName: onto.ontology_name,
          domainArray: onto.domain,
          ontologyDescribe: onto.ontology_des
        });
        setOntoLibType(CANVAS_OP_TYPE.IMPORT);
        setOntoData(onto);
        setCanvasCurrent(2);
        setCanShowCanvas(true);
      } catch {
        //
      }
    }
  };

  const onSelectCreateOrImportMenu = (e: any) => {
    const menuKey = e.key;
    switch (menuKey) {
      case CREATE_IMPORT_MENU[0].id: {
        setOntoLibType(CANVAS_OP_TYPE.CREATE);
        setShowSaveOntologyModal(true);
        // onCreateOnto();
        break;
      }
      case CREATE_IMPORT_MENU[1].id:
        openModalImport();
        break;
      default:
        break;
    }
  };

  const exportEntityFunc = async (record: any, key: string) => {
    const data = {
      otl_id: record.otl_id,
      format: key
    };
    if (key === 'json') {
      const res = await servicesCreateEntity.exportEntityJson(data);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const hideElement = document.createElement('a');
      hideElement.href = URL.createObjectURL(blob);
      hideElement.download = `${record.ontology_name}.json`;
      hideElement.style.display = 'none';
      document.body.appendChild(hideElement);
      hideElement.click();
    } else {
      const res = await servicesCreateEntity.exportEntityXlsx(data);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(res.data);
      link.download = `${record.ontology_name}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
    }
  };

  const onSelectOutputOrAuthManagerMenu = (e: any, record: any) => {
    const menuKey = e.key;
    switch (menuKey) {
      case MORE_MENU(record)[0].id:
        onCopy(record);
        break;
      case MORE_MENU(record)[1].id:
        onDeleteAction(record);
        break;
      case MORE_MENU(record)[2].id:
        setAuthOntoData(record);
        break;
      case EXPORT_MENU(record)[0].id:
        exportEntityFunc(record, menuKey);
        break;
      case EXPORT_MENU(record)[1].id:
        exportEntityFunc(record, menuKey);
        break;
      default:
        break;
    }
  };

  // const onCreateOnto = () => {
  //   setOntoLibType(CANVAS_OP_TYPE.CREATE);
  //   setCanvasCurrent(2);
  //   setCanShowCanvas(true);
  // };

  // 表格复选框配置
  const rowSelection: any = {
    fixed: true,
    type: 'checkbox',
    selectedRowKeys,
    onChange: selectedRowKeysChange,
    preserveSelectedRowKeys: true
  };

  // 表格分页器配置
  const pagination = {
    current,
    total,
    pageSize,
    onChange: currentChange,
    className: 'data-table-pagination',
    // showTotal: (total: any) => intl.get('datamanagement.dataTotal', { total }),
    showTitle: false,
    showSizeChanger: false
  };

  const paginationSelected = {
    current: currentSelected,
    total: selectedRowsList.length,
    pageSize,
    onChange: (page: any) => {
      setCurrentSelected(page);
    },
    className: 'data-table-pagination',
    // showTotal: () => intl.get('datamanagement.dataTotal', { total: selectedRowsList.length }),
    showTitle: false,
    showSizeChanger: false
  };

  const menuCreateOrImport = (
    <Menu className="menu-select" onClick={onSelectCreateOrImportMenu}>
      {_.map(CREATE_IMPORT_MENU, item => {
        const { id, icon, intlText } = item;
        return (
          <Menu.Item key={id}>
            <div className="select">
              {/* <div className="icon">
                <IconFont className="icon" type={icon} />
              </div> */}
              {intl.get(intlText)}
            </div>
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const menuExport = (record: any) => {
    return (
      <Menu className="menu-select" onClick={(e: any) => onSelectOutputOrAuthManagerMenu(e, record)}>
        {_.map(EXPORT_MENU(record), item => {
          const { id, intlText, disable } = item;
          return (
            <Menu.Item disabled={disable} key={id}>
              <div className="select">{intl.get(intlText)}</div>
            </Menu.Item>
          );
        })}
      </Menu>
    );
  };

  const menuOutputOrAuthManager = (record: any) => {
    return (
      <Menu className="menu-select" onClick={(e: any) => onSelectOutputOrAuthManagerMenu(e, record)}>
        {_.map(MORE_MENU(record), item => {
          const { id, intlText, disable } = item;
          return (
            <Menu.Item disabled={disable} key={id}>
              <div className="select">{intl.get(intlText)}</div>
            </Menu.Item>
          );
        })}
      </Menu>
    );
  };

  /**
   * 删除按钮，将选择的项加入待删除list 打开弹框
   */
  const onDelete = async (record?: any) => {
    const title = intl.get('ontoLib.deleteTitle');
    const content = intl.get('ontoLib.deleteContent');
    const isOk = await tipModalFunc({ title, content, closable: false });
    onDeleteChoose(isOk, record);
  };

  const onDeleteChoose = async (isOk: any, record?: Record<string, any>) => {
    if (!isOk) return;
    setLoading(true);
    const data = {
      otl_ids: record ? [record.otl_id] : selectedRowKeys,
      knw_id: knData.id
    };

    try {
      const { res } = (await servicesCreateEntity.delEntity(data)) || [];
      if (res?.otl_ids) {
        // message.success(intl.get('ontoLib.deleteSuccess'));
        message.success({
          content: intl.get('ontoLib.deleteSuccess'),
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
        if (current !== 1) {
          setCurrent(1);
        } else {
          fetchOntoList(current, sorter, searchValue);
        }
      }
      if (res?.ErrorCode) {
        // message.error(res?.ErrorDetails);
        message.error({
          content: res?.ErrorDetails,
          className: 'custom-class',
          style: {
            marginTop: '6vh'
          }
        });
      }
    } catch (err) {
      //
    }
    setLoading(false);
    setSelectedRowKeys([]);
    setSelectedRowsList([]);
  };

  /**
   * 表格排序
   */
  const sortOrderChange = (_pagination: any, _filters: any, sorter: any, extra: any) => {
    if (extra.action !== 'sort') return;
    const order = sorterConvert(sorter.order);
    const rule = sorterConvert(sorter.field);
    setSorter({ rule, order });
  };

  const onSortMenuClick = (key: any) => {
    setSorter(({ rule, order }) => ({
      rule: key,
      order: rule === key ? (order === 'desc' ? 'asc' : 'desc') : order
    }));
  };

  /**
   * 同步搜索的值
   */
  const searchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (!e?.target?.value) return;
    setSearchValue(e?.target?.value);
  };

  /**
   * 模糊查询
   */
  const onSearch = (value: string) => {
    setSearchValue(value);
  };

  /**
   * 刷新
   */
  const onRefresh = () => {
    if (current !== 1) {
      setCurrent(1);
    } else {
      fetchOntoList(current, sorter, searchValue);
    }
  };

  const onExitFunc = async () => {
    if (showQuitTip.current) {
      const title = intl.get('ontoLib.quitTitle');
      const content = intl.get('ontoLib.quitContent');
      const isOk = await tipModalFunc({ title, content, closable: true });
      if (!isOk) return;
      fetchOntoList(current, sorter, searchValue);
      setCanShowCanvas(false);
    } else {
      fetchOntoList(current, sorter, searchValue);
      setCanShowCanvas(false);
    }
  };

  return (
    <div className="ontoLib">
      <Format.Title className="kw-c-header" style={{ marginBottom: 18 }}>
        {intl.get('ontoLib.ontoLib')}
      </Format.Title>
      <div className="kw-space-between tool-box">
        <div className="left-box kw-align-center">
          <ContainerIsVisible placeholder={<span style={{ height: 32, display: 'inline-block' }} />}>
            <Button
              type="primary"
              style={{ marginRight: 12 }}
              onClick={() => {
                setOntoLibType(CANVAS_OP_TYPE.CREATE);
                setShowSaveOntologyModal(true);
              }}
            >
              <IconFont type="icon-Add" style={{ color: '#fff' }} />
              {intl.get('ontoLib.createOntoLib')}
            </Button>
            {/* <Button onClick={openModalImport} type="default" style={{ marginRight: 12 }}>
              <IconFont type="icon-daoru" />
              {intl.get('ontoLib.importOnto')}
            </Button> */}
          </ContainerIsVisible>
          <Button
            className="ant-btn-default delete-botton"
            onClick={e => onDelete()}
            disabled={selectedRowKeys.length <= 0}
          >
            <IconFont type="icon-lajitong" />
            {intl.get('ontoLib.deleteOnto')}
          </Button>
        </div>

        <div className="kw-align-center">
          <SearchInput
            onChange={e => {
              e.persist();
              searchChange(e);
            }}
            onPressEnter={(e: any) => onSearch(e?.target?.value)}
            onClear={() => onSearch('')}
            placeholder={intl.get('ontoLib.searchPlaceHold')}
            debounce
          />
          <Dropdown
            placement="bottomLeft"
            overlay={
              <Menu selectedKeys={[sorter.rule]} onClick={({ key }) => onSortMenuClick(key)}>
                {SORTER_KEYS.map(({ key, text }) => (
                  <Menu.Item key={key}>
                    <ArrowDownOutlined
                      rotate={sorter.order === 'desc' ? 0 : 180}
                      style={{ opacity: sorter.rule === key ? 0.8 : 0, fontSize: 15 }}
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

          <Format.Button type="icon" tip={intl.get('global.refresh')} onClick={() => onRefresh()}>
            <IconFont type="icon-tongyishuaxin" />
          </Format.Button>
        </div>
      </div>
      <KwTable
        lastColWidth={170}
        showHeader={false}
        dataSource={tableData}
        columns={columns}
        tableLayout="fixed"
        rowSelection={rowSelection}
        rowKey={(record: any) => record.otl_id}
        pagination={pagination}
        className={'dataSource-table'}
        loading={loading ? { indicator: antIconBig, wrapperClassName: 'dataSource-Loading' } : false}
        emptyImage={!searchValue ? AddContent : noResult}
        emptyText={
          !searchValue ? (
            <ContainerIsVisible placeholder={<p>{intl.get('datamanagement.noContent')}</p>}>
              <span>
                {intl.get('ontoLib.noOntoCreate').split('|')[0]}
                <span
                  className="create-span"
                  onClick={() => {
                    setOntoLibType(CANVAS_OP_TYPE.CREATE);
                    setShowSaveOntologyModal(true);
                  }}
                >
                  {intl.get('ontoLib.noOntoCreate').split('|')[1]}
                </span>
                {intl.get('ontoLib.noOntoCreate').split('|')[2]}
              </span>
            </ContainerIsVisible>
          ) : (
            intl.get('global.noResult2')
          )
        }
        onChange={sortOrderChange}
        scroll={{ x: '100%' }}
        onRow={record => {
          return {
            onClick: e => {
              // 点击选中check-box
              // e.currentTarget.getElementsByClassName('ant-checkbox-wrapper')[0].click();
            }
          };
        }}
      />
      <ModalOntoImport
        knw_id={knData.id}
        isVisible={isVisibleImport}
        isVisibleModalFeedback={isVisibleModalFeedback}
        onClose={closeModalImport}
        closeModalFeedback={closeModalFeedback}
      />
      {canShowCanvas && (
        <OntoLibG6
          ontoLibData={ontoLibData}
          ontoLibType={ontoLibType}
          knData={knData}
          canShowCanvas={canShowCanvas}
          current={canvasCurrent}
          osId={osId}
          dbType={dbType}
          graphId={graphId}
          ontoData={ontoData}
          ontologyId={ontologyId}
          setOntoData={setOntoData}
          onExit={onExitFunc}
          showQuitTip={showQuitTip}
          defaultParsingRule={defaultParsingRule}
          setDefaultParsingRule={setDefaultParsingRule}
          parsingTreeChange={parsingTreeChange}
          setParsingTreeChange={setParsingTreeChange}
          sourceFileType={sourceFileType}
          setSourceFileType={setSourceFileType}
        />
      )}
      {showSaveOntologyModal && (
        <SaveOntologyModal
          ref={saveOntoRef}
          showSaveOntologyModal={showSaveOntologyModal}
          closeSaveOntologyModal={closeSaveOntologyModal}
          modalOkSave={modalOkSave}
          initData={
            ontoLibType === CANVAS_OP_TYPE.CREATE
              ? { ontologyName: '', domainArray: [], ontologyDescribe: '' }
              : {
                  ontologyName: copyDetail?.current.ontology_name,
                  domainArray: copyDetail?.current.domain,
                  ontologyDescribe: copyDetail?.current.ontology_des
                }
          }
          modalTitle={intl.get('ontoLib.createOntoLib')}
        />
      )}
    </div>
  );
};

export default OntoLib;
