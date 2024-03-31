import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { useHistory, useLocation } from 'react-router-dom';
import { Tabs, Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import LoadingMask from '@/components/LoadingMask';
import HELPER from '@/utils/helper';
import { getParam } from '@/utils/handleFunction';
import { PERMISSION_KEYS, PERMISSION_CODES, GRAPH_STATUS } from '@/enums';
import serviceGraphDetail from '@/services/graphDetail';
import servicesPermission from '@/services/rbacPermission';
import { ad_onChangeGraphStatus } from '@/reduxConfig/action/knowledgeGraph';

import asyncComponent from '@/components/AsyncComponent';
import ContainerIsVisible from '@/components/ContainerIsVisible';
import TaskList from './taskList';
import Header from './Header';

const GraphDetail = asyncComponent(() => import('./GraphDetail'));
const ExploreAnalysis = asyncComponent(() => import('./ExploreAnalysis'));

import knowledgeEmpty from '@/assets/images/kgEmpty.svg';
import './index.less';
import { useUpdateEffect } from '@/hooks/useUpdateEffect';

const initTab = () => {
  const tab = getParam('tab');
  return ['detail', 'task', 'canvas'].includes(tab) ? tab : 'detail';
};

let TIMER = null;
const GraphContent = props => {
  const history = useHistory();
  const location = useLocation();
  const { ad_onChangeGraphStatus, ad_graphStatus } = props;
  const {
    loading,
    selectedGraph,
    selectedKnowledge,
    setSelectedGraph,
    onRefreshLeftSpace,
    openAuthPage,
    openModalImport,
    tabsKey,
    setTabsKey,
    collapsed,
    setCollapsed,
    onGraphBuildFinish // 图谱构建事件
  } = props;

  // const [tabsKey, setTabsKey] = useState(() => initTab());
  const [graphBasicData, setGraphBasicData] = useState({});
  const [isFetching, setIsFetching] = useState(false);
  const taskListRef = useRef();

  useUpdateEffect(() => {
    if ([GRAPH_STATUS.NORMAL, GRAPH_STATUS.FAIL].includes(ad_graphStatus)) {
      getGraphData();
    }
  }, [ad_graphStatus]);

  useEffect(() => {
    getGraphData();
    onUpdateGraphStatus('');
    // }, [selectedGraph?.kgConfId]);
  }, [selectedGraph?.id]);

  useEffect(() => {
    // 图数据库无缝切换，graphdb_dbname更新的问题
    if (tabsKey === 'detail') getGraphData();
    let search = getParam() || {};
    search.tab = tabsKey;
    search = HELPER.formatQueryString(search);
    history.push({ pathname: location.pathname, search });
  }, [tabsKey]);

  // useEffect(() => {
  //   // 获取列表权限, 判断权限
  //   if (_.isEmpty(graphBasicData)) return;
  //   // DATA-354277 dataPermission 入参dataIds kg_conf_id -> id
  //   // const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds: [String(graphBasicData?.kg_conf_id)] };
  //   const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds: [String(graphBasicData?.id)] };
  //   servicesPermission.dataPermission(postData).then(result => {
  //     setGraphBasicData({ ...graphBasicData, __codes: result?.res?.[0]?.codes || [] });
  //   });
  // }, [JSON.stringify(graphBasicData)]);

  const getGraphData = async () => {
    // if (!selectedGraph?.kgconfid) return;
    if (!selectedGraph?.id) return;
    try {
      // const getData = { is_all: true, graph_id: selectedGraph.kgconfid };
      const getData = { is_all: true, graph_id: selectedGraph.id };
      const result = await serviceGraphDetail.graphGetInfoBasic(getData);
      const data = result?.res || {};
      if (!_.isEmpty(data)) {
        const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds: [String(data?.id)] };
        // servicesPermission.dataPermission(postData).then(result => {
        //   setGraphBasicData({ ...data, __codes: result?.res?.[0]?.codes || [] });
        // });
        setGraphBasicData(data);
      } else {
        setGraphBasicData(data);
      }
    } catch (error) {
      const { type, response } = error;
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  useEffect(() => () => clearTimeout(TIMER), []);
  const onRefresh = async (isShowLoading = true) => {
    if (isShowLoading) {
      setIsFetching(true);
      await getGraphData();
      TIMER = setTimeout(() => setIsFetching(false), 500);
    } else {
      getGraphData();
    }
  };

  const onUpdateGraphStatus = status => {
    ad_onChangeGraphStatus({ ad_graphStatus: status });
    onGraphBuildFinish && onGraphBuildFinish(status);
  };

  const openErrorModal = error => {
    taskListRef.current?.openErrorModal(error);
  };

  return (
    <div className="networkContentRoot kw-flex-item-full-width kw-flex-column">
      {selectedGraph?.id && (
        <Header
          graphId={selectedGraph?.id}
          isFetching={isFetching}
          graphBasicData={graphBasicData}
          selectedKnowledge={selectedKnowledge}
          onRefresh={onRefresh}
          openAuthPage={openAuthPage}
          onSelectedGraph={setSelectedGraph}
          onRefreshLeftSpace={onRefreshLeftSpace}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          onUpdateGraphStatus={onUpdateGraphStatus}
          openErrorModal={openErrorModal}
        />
      )}

      {selectedGraph?.id ? (
        <div className="content-box kw-flex-item-full-height">
          <LoadingMask loading={isFetching} />
          <GraphDetail
            tabsKey={tabsKey}
            isFetching={isFetching}
            graphBasicData={graphBasicData}
            graphid={graphBasicData?.id}
            selectedKnowledge={selectedKnowledge}
          />
          <div style={{ display: 'none' }}>
            <TaskList
              ref={taskListRef}
              tabsKey="task"
              selectedGraph={graphBasicData}
              onUpdateGraphStatus={onUpdateGraphStatus}
            />
          </div>
          {/* <Tabs className="main-tabs" activeKey={tabsKey} onChange={tabsChange}>*/}
          {/*  <Tabs.TabPane tab={intl.get('graphDetail.graphOverview')} key="detail">*/}
          {/*    <Spin*/}
          {/*      style={{ maxHeight: '100%' }}*/}
          {/*      spinning={isFetching}*/}
          {/*      indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}*/}
          {/*    >*/}
          {/*      <GraphDetail*/}
          {/*        tabsKey={tabsKey}*/}
          {/*        isFetching={isFetching}*/}
          {/*        graphBasicData={graphBasicData}*/}
          {/*        graphid={graphBasicData?.id}*/}
          {/*        selectedKnowledge={selectedKnowledge}*/}
          {/*      />*/}
          {/*    </Spin>*/}
          {/*  </Tabs.TabPane>*/}
          {/*  <Tabs.TabPane tab={intl.get('global.analysis')} key="canvas">*/}
          {/*    <ExploreAnalysis onRefreshLeftSpace={onRefreshLeftSpace} selectedGraph={selectedGraph} />*/}
          {/*  </Tabs.TabPane>*/}
          {/*  {graphBasicData?.property_id !== 4 ? (*/}
          {/*    <Tabs.TabPane*/}
          {/*      key="task"*/}
          {/*      disabled={!(graphBasicData?.step_num >= 4)}*/}
          {/*      tab={*/}
          {/*        <div title={graphBasicData?.step_num < 4 ? [intl.get('createEntity.noData')] : null}>*/}
          {/*          {intl.get('knowledge.task')}*/}
          {/*        </div>*/}
          {/*      }*/}
          {/*    >*/}
          {/*      <TaskList */}
          {/*        tabsKey={tabsKey} */}
          {/*        selectedGraph={graphBasicData}*/}
          {/*        onUpdateGraphStatus={onUpdateGraphStatus}*/}
          {/*      />*/}
          {/*    </Tabs.TabPane>*/}
          {/*  ) : null}*/}
          {/* </Tabs>*/}
        </div>
      ) : loading ? (
        <div className="empty-box">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}></Spin>
        </div>
      ) : (
        <div className="empty-box">
          <img src={knowledgeEmpty} alt="nodata" className="nodata-img"></img>
          <div className="text-des kw-c-text-lower">
            <ContainerIsVisible
              placeholder={intl.get('knowledge.noKnowledgeGraphs')}
              isVisible={HELPER.getAuthorByUserInfo({
                roleType: PERMISSION_CODES.ADF_KN_KG_CREATE,
                userType: PERMISSION_KEYS.KN_ADD_KG,
                userTypeDepend: selectedKnowledge?.__codes
              })}
            >
              <div>
                {intl.get('knowledge.click')}
                <span
                  className="create-span"
                  onClick={() => history.push(`/knowledge/workflow/create?knId=${selectedKnowledge?.id}`)}
                >
                  {intl.get('global.emptyTableCreate')}
                </span>
                {intl.get('knowledge.build')}
                <React.Fragment>
                  {intl.get('knowledge.orClick')}
                  <span onClick={openModalImport} className="create-span">
                    {intl.get('knowledge.emptyDesImport')}
                  </span>
                  {intl.get('knowledge.toUpload')}
                </React.Fragment>
              </div>
            </ContainerIsVisible>
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = state => {
  return {
    ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
  };
};
const mapDispatchToProps = dispatch => ({
  ad_onChangeGraphStatus: payload => dispatch(ad_onChangeGraphStatus(payload))
});

export default connect(mapStateToProps, mapDispatchToProps)(GraphContent);
