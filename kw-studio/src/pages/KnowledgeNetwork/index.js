import React, { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import _ from 'lodash';
import classnames from 'classnames';
import intl from 'react-intl-universal';
import { Route, Switch, Redirect, useHistory, useLocation, Prompt } from 'react-router-dom';
import { Spin, Menu, Tooltip, Dropdown, Divider } from 'antd';
import { DownOutlined, EllipsisOutlined, LoadingOutlined } from '@ant-design/icons';

import { GRAPH_STATUS, PERMISSION_CODES, PERMISSION_KEYS } from '@/enums';
import { getParam, sessionStore } from '@/utils/handleFunction';
import servicesPermission from '@/services/rbacPermission';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';

import CHeader from '@/components/Header';
import IconFont from '@/components/IconFont';
import KnowledgeModal from '@/components/KnowledgeModal';
import asyncComponent from '@/components/AsyncComponent';
import ReactRouterPrompt from '@/components/ReactRouterPrompt';

import Sidebar from './Sidebar';
import DeleteKNModal from './DeleteKNModal';
import LoadingMask from '@/components/LoadingMask';
import './index.less';
import AdKnowledgeNetIcon from '@/components/AdKnowledgeNetIcon/AdKnowledgeNetIcon';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import HELPER from '@/utils/helper';
import useAdHistory from '@/hooks/useAdHistory';

import { tipModalFunc } from '@/components/TipModal';
import AuthChildRoute from '@/components/AuthChildRoute';

const KnowledgeNetworkList = asyncComponent(() => import('./KnowledgeNetworkList')); // 知识网络列表
const ThesaurusModeCreate = asyncComponent(() => import('./ThesaurusModeCreate')); // 词库编辑
const ExploreGraph = asyncComponent(() => import('./ExploreGraph')); // 知识图谱调试页面
const DomainIQ = asyncComponent(() => import('./DomainIQ')); // 领域智商
const KnowledgeGraph = asyncComponent(() => import('./KnowledgeGraph')); // 知识图谱
const KnowledgeGraphWorkflow = asyncComponent(() => import('./KnowledgeGraph/Workflow')); // 知识图谱创建编辑页面
const ThesaurusManagement = asyncComponent(() => import('./ThesaurusManagement')); // 词库
const OntoLib = asyncComponent(() => import('./OntologyLibrary')); // 本体库
const GlossaryManage = asyncComponent(() => import('./Glossary')); // 术语库
const DataSource = asyncComponent(() => import('./DataSource')); // 数据源管理
const FunctionManage = asyncComponent(() => import('./FunctionManage')); // 函数管理
const DataSourceQuery = asyncComponent(() => import('./DataSourceQuery')); // 数据源查询
const GraphTaskRecord = asyncComponent(() => import('./KnowledgeGraph/GraphContent/GraphTaskRecord/GraphTaskRecord')); // 任务记录
const NotFound = asyncComponent(() => import('@/components/NotFoundChildPage'));

/**
 * 知识网络入口
 * @returns {JSX.Element}
 * @constructor
 */
const KnowledgeNetwork = () => {
  const history = useHistory();
  const adHistory = useAdHistory();
  const location = useLocation();
  /** 在图可视化上面包屑上退出的逻辑
   * 1、添加退出事件：breadcrumb
   * 2、添加退出时的拦截逻辑： hasUnsaved
   */
  const [isIntercept, setIsIntercept] = useState(true);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [knowledgeNetworkOperation, setKnowledgeNetworkOperation] = useState('');
  const [knList, setKnList] = useState([]);
  const [knData, setKnData] = useState({});
  const currentPageSign = useRef(''); // 当前页面的标识
  const glossaryRef = useRef();
  const [knowledgeNetId, setKnowledgeNetId] = useState(sessionStore.get('selectedKnowledgeId') || getParam('id'));
  const [isChange, setIsChange] = useState(false); // 是否操作过数据
  const [isPrevent, setIsPrevent] = useState(false); // 是否显示切换的数据
  const [defaultSelectRoute, setDefaultSelectRoute] = useState('');

  useEffect(() => {
    const opType = getParam('opType');
    if (!opType) setIsIntercept(false);
  }, [window?.location?.search]);

  useEffect(() => {
    // 获取列表权限, 判断权限
    if (_.isEmpty(knData) || isPrevent) return;
    const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds: [String(knData?.id)] };
    // servicesPermission.dataPermission(postData).then(result => {
    //   const newKgData = { ...knData };
    //   newKgData.__codes = result?.res?.[0]?.codes;
    //   newKgData.__isCreator = result?.res?.[0]?.isCreator;
    //   setKnData(newKgData);
    // });
    setKnData(knData);
  }, [JSON.stringify(knData)]);

  useEffect(() => {
    if (!knowledgeNetId) return;
    // 改过的权限
    const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds: [String(knowledgeNetId)] };
    // servicesPermission.dataPermission(postData).then(result => {
    // if (_.isEmpty(result?.res?.[0]?.codes)) window.location.replace('/home');
    // });
    getKnowledgeList();
  }, [knowledgeNetId]);

  const findSelectedKnowledge = (list, id) => {
    for (let i = 0, { length } = list; i < length; i++) {
      const item = list[i];
      if (item.id === parseInt(id)) {
        sessionStore.set('selectedKnowledgeId', parseInt(id));
        return item;
      }
    }
    return {};
  };
  const getKnowledgeList = async () => {
    const data = { page: 1, size: 10000, order: 'desc', rule: 'update' };
    try {
      const result = await servicesKnowledgeNetwork.knowledgeNetGet(data);
      if (result?.res?.df && result?.res?.df?.length > 0) {
        let items = result?.res?.df;
        // const dataIds = _.map(result?.res?.df, item => String(item.id));
        // const postData = { dataType: PERMISSION_KEYS.TYPE_KN, dataIds };
        // const permissionResult = (await servicesPermission.dataPermission(postData)) || {};
        // const codesData = _.keyBy(permissionResult?.res, 'dataId');
        // items = _.map(result?.res?.df, item => {
        //   const { codes = [], isCreator = 0 } = codesData?.[item.id] || {};
        //   item.__isCreator = isCreator;
        //   item.__codes = codes;
        //   return item;
        // });
        setKnList(items);
        const data = findSelectedKnowledge(items, knowledgeNetId);
        if (_.isEmpty(data)) {
          const { search, pathname } = location;
          const newSearch = `${search.split('=')[0]}=${items?.[0]?.id}`;
          const url = `${pathname}${newSearch}`;
          history.replace(url);
        } else {
          setKnData(knowledgeNetId ? data : {});
        }
      }
    } catch (error) {}
  };

  const onChangeHasUnsaved = saved => {
    if (!saved) {
      setIsIntercept(false);
    }
    setHasUnsaved(saved);
  };

  // 点击进入知识网络
  const onToPageNetwork = async id => {
    const { pathname } = location;
    const url = `/knowledge/studio-network?id=${id}`;
    if (isChange && pathname === '/knowledge/knowledge-thesaurus-create') {
      const isOk = await tipModalFunc({
        title: intl.get('ThesaurusManage.createMode.tip'),
        content: intl.get('ThesaurusManage.createMode.tipContent')
      });
      if (!isOk) {
        setIsPrevent(true);
        return;
      }

      setIsChange(false);
      setIsPrevent(false);
      history.replace(url);
      setKnowledgeNetId(id);
      return;
    }
    setIsPrevent(false);

    history.replace(url);
    setKnowledgeNetId(id);
  };

  /** 创建知识网络弹窗相关操作 */
  const [operation, setOperation] = useState({ type: '', visible: false, data: {} });
  const onCreateNetwork = (type, data = {}) => setOperation({ type, data, visible: !!type });
  const onCloseCreateModel = () => setOperation({});

  /** 删除知识网络弹窗相关操作 */
  const [delId, setDelId] = useState(0);
  const onOpenDelete = item => setDelId(item.id);
  const onCloseDelete = () => setDelId(0);
  const onRefreshListAfterDeleteKn = delKnId => {
    if (knList.length === 1) {
      // 说明删除的是列表中唯一的知识网络删除完毕之后   要退回到/home页
      sessionStore.remove('selectedKnowledgeId');
      history.replace('/home');
      return;
    }
    if (String(delKnId) === String(knowledgeNetId)) {
      const delIndex = knList.findIndex(item => item.id === delKnId);
      if (delIndex === -1) return;
      let targetIndex = delIndex;
      if (delIndex === 0) {
        // 说明位置是第一个
        targetIndex = delIndex + 1;
      } else {
        targetIndex = delIndex - 1;
      }
      // 说明删除的知识网络是当前选中的知识网络
      handleChangeSelectKn(knList[targetIndex].id);
    }
    getKnowledgeList();
  };

  const onChangeSelectKn = value => {
    // 两次点击相同的知识网络证明不用切换
    if (Number(knowledgeNetId) === value.key) return;

    // 说明此时在术语详情页面切换的知识网络
    if (currentPageSign.current === 'glossary-detail') {
      glossaryRef.current.openExitModalVisible(value.key);
      return;
    }

    if (value.domEvent.target.nodeName === 'SPAN') return;
    setKnowledgeNetworkOperation('');
    sessionStore.remove('thesaurusSelectedId');

    if (hasUnsaved) setIsIntercept(true);

    handleChangeSelectKn(value.key);
  };

  /**
   * 真正的执行切换知识网络的逻辑
   * @param id 知识网络id
   */
  const handleChangeSelectKn = async id => {
    const { pathname } = location;
    const newSearch = `?id=${id}`;
    let path = pathname;
    if (
      [
        '/knowledge/graph-task-record',
        '/knowledge/graph-auth',
        '/knowledge/glossary-auth',
        '/knowledge/function-auth',
        '/knowledge/dataSource-auth',
        '/knowledge/otl-auth',
        '/knowledge/word-auth',
        '/knowledge/explore',
        '/knowledge/knowledge-thesaurus-create'
      ].includes(pathname)
    ) {
      if (pathname === '/knowledge/knowledge-thesaurus-create' && isChange) {
        const isOk = await tipModalFunc({
          title: intl.get('ThesaurusManage.createMode.tip'),
          content: intl.get('ThesaurusManage.createMode.tipContent')
        });
        if (!isOk) {
          setIsPrevent(true);
          return;
        }
        setIsPrevent(false);
        setIsChange(false);
        path = '/knowledge/studio-network';
      } else {
        path = '/knowledge/studio-network';
      }
    }
    const url = `${path}${newSearch}`;
    history.replace(url);
    setKnowledgeNetId(id);
  };

  /**
   * 知识图谱构建完成事件
   * status 成功或者失败
   */
  const onGraphBuildFinish = status => {
    if ([GRAPH_STATUS.NORMAL, GRAPH_STATUS.FAIL].includes(status)) {
      getKnowledgeList();
    }
  };

  const knSelectMenus = (
    <div className="knowledgeNetworkRootMenuSelect kw-flex-column">
      <Menu className="kw-flex-item-full-height" onClick={onChangeSelectKn} selectedKeys={[]}>
        {_.map(knList, item => {
          const { color, knw_name } = item;
          const selected = String(item?.id) === String(knowledgeNetId);
          return (
            <Menu.Item
              key={item?.id}
              className={classnames('menuItem', { menuItemSelected: selected })}
              style={{ height: 40 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="kw-ellipsis kw-align-center" style={{ width: 170 }} title={knw_name}>
                  <AdKnowledgeNetIcon style={{ marginRight: 6 }} type={color} />
                  <div className="kw-flex-item-full-width kw-ellipsis">{knw_name}</div>
                </div>
                <Dropdown
                  overlay={
                    <Menu>
                      <ContainerIsVisible
                        isVisible={HELPER.getAuthorByUserInfo({
                          roleType: PERMISSION_CODES.ADF_KN_EDIT,
                          userType: PERMISSION_KEYS.KN_EDIT,
                          userTypeDepend: item?.__codes
                        })}
                      >
                        <Menu.Item
                          key="edit"
                          onClick={({ domEvent }) => {
                            // domEvent.stopPropagation();
                            setKnowledgeNetworkOperation('');
                            onCreateNetwork('edit', item);
                          }}
                        >
                          {intl.get('exploreGraph.edit')}
                        </Menu.Item>
                      </ContainerIsVisible>

                      <ContainerIsVisible
                        isVisible={HELPER.getAuthorByUserInfo({
                          roleType: PERMISSION_CODES.ADF_KN_DELETE,
                          userType: PERMISSION_KEYS.KN_DELETE,
                          userTypeDepend: item?.__codes
                        })}
                      >
                        <Menu.Item
                          key="delete"
                          onClick={({ domEvent }) => {
                            // domEvent.stopPropagation();
                            setKnowledgeNetworkOperation('');
                            onOpenDelete(item);
                          }}
                        >
                          {intl.get('exploreGraph.Delete')}
                        </Menu.Item>
                      </ContainerIsVisible>

                      <ContainerIsVisible
                        isVisible={HELPER.getAuthorByUserInfo({
                          roleType: PERMISSION_CODES.ADF_KN_MEMBER,
                          userType: PERMISSION_KEYS.KN_EDIT_PERMISSION,
                          userTypeDepend: item?.__codes
                        })}
                      >
                        <Menu.Item
                          key="authorityManagement"
                          onClick={({ domEvent }) => {
                            domEvent.stopPropagation();
                            setKnowledgeNetworkOperation('');
                            const { id, knw_name } = item;
                            history.push(`/knowledge/knowledge-net-auth?knId=${id}&knName=${knw_name}`);
                          }}
                        >
                          {intl.get('exploreGraph.authorityManagement')}
                        </Menu.Item>
                      </ContainerIsVisible>
                    </Menu>
                  }
                  visible={knowledgeNetworkOperation === item?.id}
                  trigger={['click']}
                  placement="bottomLeft"
                  overlayClassName="knowledgeNetworkOperation"
                >
                  <div
                    className={classnames('knoMenuOperation', {
                      knoMenuOperationSelected: knowledgeNetworkOperation === item?.id
                    })}
                  >
                    <EllipsisOutlined
                      onClick={e => {
                        e.stopPropagation();
                        setKnowledgeNetworkOperation(item?.id);
                      }}
                    />
                  </div>
                </Dropdown>
              </div>
              {/* </Tooltip> */}
            </Menu.Item>
          );
        })}
      </Menu>
      <div className="kw-border-t kw-mt-1 kw-mb-1" />
      <div className="knowledgeNetworkRootMenuSelect-operate">
        <div
          className="knowledgeNetworkRootMenuSelect-operate-item menuItem kw-align-center"
          style={{ height: 40 }}
          onClick={() => {
            adHistory.push('/knowledge/knowledge-net');
          }}
        >
          {/* <IconFont type="icon-zhishiwangluoguanli" style={{ color: '#000', marginRight: 8 }} />*/}
          {intl.get('graphList.knowledgeNetManage')}
        </div>
        <ContainerIsVisible
          isVisible={HELPER.getAuthorByUserInfo({
            roleType: PERMISSION_CODES.ADF_KN_CREATE
          })}
        >
          <div
            className="knowledgeNetworkRootMenuSelect-operate-item menuItem kw-align-center"
            style={{ height: 40 }}
            onClick={() => {
              onCreateNetwork('add');
            }}
          >
            {/* <IconFont type="icon-Add" style={{ color: '#000', marginRight: 8 }} />*/}
            {intl.get('exploreGraph.createNetwork')}
          </div>
        </ContainerIsVisible>
      </div>
    </div>
  );

  const breadcrumb = {
    key: 'breadcrumb',
    label: (
      <div className="kw-align-center">
        <Divider type="vertical" style={{ margin: '0px 16px', borderColor: 'rgba(0,0,0,.1)' }} />
        <div className="breadcrumb kw-pointer">
          <Dropdown
            overlay={knSelectMenus}
            trigger={['click']}
            placement="bottomLeft"
            onVisibleChange={open => {
              if (!open) setKnowledgeNetworkOperation('');
            }}
          >
            <div className="kw-align-center">
              <AdKnowledgeNetIcon style={{ marginRight: 6 }} type={knData?.color} />
              <Tooltip placement="right" title={knData?.knw_name}>
                <div className="kw-ellipsis" style={{ maxWidth: 132 }}>
                  {knData?.knw_name}
                </div>
              </Tooltip>
              <DownOutlined style={{ color: '#fff', marginLeft: 12 }} />
            </div>
          </Dropdown>
        </div>
      </div>
    )
  };

  const appHasRoute = [
    '/knowledge/workflow/create',
    '/knowledge/workflow/edit',
    '/knowledge/explore',
    '/knowledge/graph-task-record',
    '/knowledge/graph-auth',
    '/knowledge/glossary-auth',
    '/knowledge/function-auth',
    '/knowledge/dataSource-auth',
    '/knowledge/studio-iq',
    '/knowledge/otl-auth',
    '/knowledge/word-auth',
    '/knowledge/knowledge-net-auth',
    '/knowledge/knowledge-net',
    '/knowledge/knowledge-thesaurus-create',
    '/knowledge/studio-network',
    '/knowledge/studio-concept-ontolib',
    '/knowledge/studio-concept-thesaurus',
    '/knowledge/studio-function',
    '/knowledge/studio-domainData-source',
    '/knowledge/studio-domainData-query',
    '/knowledge/studio-concept-glossary'
  ];

  // header是否显示
  const headerVisible = useMemo(() => {
    const { pathname } = location;
    // 不显示header的路由
    const noHeaderRoute = ['/knowledge/workflow/create', '/knowledge/workflow/edit', '/knowledge/explore'];
    return !noHeaderRoute.includes(pathname);
  }, [location]);

  // header的 breadcrumb 是否显示
  const headerBreadcrumbVisible = useMemo(() => {
    const { pathname } = location;
    // 不显示知识网络下拉选择框的路由
    const noKnSelectRoute = ['/knowledge/knowledge-net-auth', '/knowledge/knowledge-net'];
    return !noKnSelectRoute.includes(pathname);
  }, [location]);
  return (
    <div className="knowledgeNetworkRoot kw-flex-column" key={knData?.id}>
      {headerVisible && (
        <CHeader
          breadcrumb={headerBreadcrumbVisible && breadcrumb}
          onClickLogo={() => {
            if (hasUnsaved) setIsIntercept(true);
            setTimeout(() => history.push('/home'));
          }}
        />
      )}
      <Switch>
        <AuthChildRoute
          path="/knowledge/workflow/create"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <KnowledgeGraphWorkflow knData={knData} />}
        />
        <AuthChildRoute
          path="/knowledge/workflow/edit"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <KnowledgeGraphWorkflow knData={knData} />}
        />
        <AuthChildRoute
          path="/knowledge/explore"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <ExploreGraph onChangeHasUnsaved={onChangeHasUnsaved} />}
        />
        <AuthChildRoute
          path="/knowledge/graph-task-record"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <GraphTaskRecord />}
        />
        <AuthChildRoute
          path="/knowledge/studio-iq"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <DomainIQ knData={knData} setKnData={setKnData} />}
        />
        <AuthChildRoute
          path="/knowledge/knowledge-net"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <KnowledgeNetworkList onToPageNetwork={onToPageNetwork} />}
        />
        <AuthChildRoute
          path="/knowledge/knowledge-thesaurus-create"
          defaultRoute={defaultSelectRoute}
          allRoute={appHasRoute}
          render={() => <ThesaurusModeCreate isChange={isChange} setIsChange={setIsChange} />}
        />
        <Fragment>
          <div className="l-layout">
            <Sidebar score={knData?.intelligence_score} setDefaultSelectRoute={setDefaultSelectRoute} />
            {defaultSelectRoute !== '' && (
              <div className="l-content">
                <div className="l-main">
                  <Switch>
                    <Route
                      path="/knowledge/studio-network"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => <KnowledgeGraph knData={knData} onGraphBuildFinish={onGraphBuildFinish} />}
                    />
                    <AuthChildRoute
                      path="/knowledge/studio-concept-ontolib"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => <OntoLib knData={knData} />}
                    />
                    <AuthChildRoute
                      path="/knowledge/studio-concept-thesaurus"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => <ThesaurusManagement knData={knData} />}
                    />
                    <AuthChildRoute
                      path="/knowledge/studio-function"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => <FunctionManage key={knData.id} knData={knData} />}
                    />
                    <AuthChildRoute
                      path="/knowledge/studio-domainData-source"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => <DataSource selectedKnowledge={knData} />}
                    />
                    <AuthChildRoute
                      path="/knowledge/studio-domainData-query"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => <DataSourceQuery knData={knData} />}
                    />
                    <AuthChildRoute
                      path="/knowledge/studio-concept-glossary"
                      defaultRoute={defaultSelectRoute}
                      allRoute={appHasRoute}
                      render={() => (
                        <GlossaryManage
                          knData={knData}
                          onChangePageSign={value => (currentPageSign.current = value)}
                          handleChangeSelectKn={handleChangeSelectKn}
                          ref={glossaryRef}
                        />
                      )}
                    />
                    {/* {appHasRoute.includes(defaultSelectRoute) ? (
                    // <Redirect to={defaultSelectRoute} />
                  ) : window.location.pathname === '/knowledge' ? (
                    window.location.replace(defaultSelectRoute)
                  ) : (
                    <AuthChildRoute path={'*'} component={NotFound} />
                  )} */}
                    <Redirect from="/knowledge" to={defaultSelectRoute} />
                  </Switch>
                </div>
              </div>
            )}
          </div>
        </Fragment>
      </Switch>
      {isIntercept && (
        <ReactRouterPrompt
          isIntercept
          title={intl.get('exploreGraph.exit')}
          content={intl.get('exploreGraph.allExitContent')}
          onCancel={() => setIsIntercept(false)}
        />
      )}
      <KnowledgeModal
        visible={operation.visible && ['add', 'edit'].includes(operation.type)}
        source={operation}
        onSuccess={() => {
          getKnowledgeList();
        }}
        onToPageNetwork={onToPageNetwork}
        onCancel={onCloseCreateModel}
      />
      <DeleteKNModal
        visible={!!delId}
        delId={delId}
        onCloseDelete={onCloseDelete}
        onRefreshList={onRefreshListAfterDeleteKn}
      />
    </div>
  );
};

export default KnowledgeNetwork;
