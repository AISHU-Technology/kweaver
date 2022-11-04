import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Tabs, Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import serviceGraphDetail from '@/services/graphDetail';
import { ad_onChangeGraphStatus } from '@/reduxConfig/action/knowledgeGraph';

import Header from './Header';
import GraphDetail from './GraphDetail';
import Search from './Search';
import TaskList from './taskList';

import knowledgeEmpty from '@/assets/images/kgEmpty.svg';
import './index.less';

let TIMER = null;
const NetworkContents = props => {
  const history = useHistory();
  const { ad_onChangeGraphStatus } = props;
  const { loading, selectedGraph, selectedKnowledge, setSelectedGraph } = props;
  const { onRefreshLeftSpace, openModalImport } = props;

  const tabsKey3 = window.location.search.includes('&tabsKey');
  const [tabsKey, setTabsKey] = useState(tabsKey3 ? '3' : '1');
  const [graphBasicData, setGraphBasicData] = useState({});
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    getGraphData();
    onUpdateGraphStatus('');
  }, [selectedGraph?.kgConfId]);

  const getGraphData = async () => {
    if (!selectedGraph.kgconfid) return;
    try {
      const getData = { is_all: true, graph_id: selectedGraph.kgconfid };
      const result = await serviceGraphDetail.graphGetInfoBasic(getData);
      const data = result?.res || {};
      setGraphBasicData(data);
    } catch (error) {
      const { type = '', response = {} } = error || {};
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

  const tabsChange = key => {
    setTabsKey(key);
  };

  const onUpdateGraphStatus = status => {
    ad_onChangeGraphStatus({ ad_graphStatus: status });
  };

  return (
    <div className="networkContentRoot">
      <Header
        graphBasicData={graphBasicData}
        selectedKnowledge={selectedKnowledge}
        onRefresh={onRefresh}
        onSelectedGraph={setSelectedGraph}
        onRefreshLeftSpace={onRefreshLeftSpace}
      />
      {selectedGraph.kgconfid ? (
        <div className="content-box">
          <Tabs className="main-tabs" activeKey={tabsKey} onChange={tabsChange}>
            <Tabs.TabPane tab={intl.get('graphDetail.graphOverview')} key="1">
              <Spin
                style={{ maxHeight: '100%' }}
                spinning={isFetching}
                indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}
              >
                <GraphDetail
                  tabsKey={tabsKey}
                  isFetching={isFetching}
                  graphBasicData={graphBasicData}
                  graphid={graphBasicData?.kg_conf_id}
                />
              </Spin>
            </Tabs.TabPane>
            <Tabs.TabPane
              key="2"
              disabled={!(graphBasicData?.step_num >= 6)}
              tab={
                <div title={graphBasicData?.step_num < 6 ? intl.get('createEntity.noData') : null}>
                  {intl.get('knowledge.analysis')}
                </div>
              }
            >
              <Search selectedGraph={selectedGraph} />
            </Tabs.TabPane>
            <Tabs.TabPane
              key="3"
              disabled={!graphBasicData?.display_task || !(graphBasicData?.step_num >= 6)}
              tab={
                <div title={graphBasicData?.step_num < 6 ? intl.get('createEntity.noData') : null}>
                  {intl.get('knowledge.task')}
                </div>
              }
            >
              <TaskList selectedGraph={graphBasicData} tabsKey={tabsKey} onUpdateGraphStatus={onUpdateGraphStatus} />
            </Tabs.TabPane>
          </Tabs>
        </div>
      ) : loading ? (
        <div className="empty-box">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 30 }} spin />}></Spin>
        </div>
      ) : (
        <div className="empty-box">
          <img src={knowledgeEmpty} alt="nodata" className="nodata-img"></img>
          <div className="text-des">
            <div className="">
              {intl.get('knowledge.click')}
              <span className="create-span" onClick={() => history.push('/home/workflow/create')}>
                {intl.get('global.emptyTableCreate')}
              </span>
              {intl.get('knowledge.build')}
              {intl.get('knowledge.orClick')}
              <span onClick={openModalImport} className="create-span">
                {intl.get('knowledge.emptyDesImport')}
              </span>
              {intl.get('knowledge.toUpload')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const mapStateToProps = () => ({});
const mapDispatchToProps = dispatch => ({
  ad_onChangeGraphStatus: payload => dispatch(ad_onChangeGraphStatus(payload))
});

export default connect(mapStateToProps, mapDispatchToProps)(NetworkContents);
