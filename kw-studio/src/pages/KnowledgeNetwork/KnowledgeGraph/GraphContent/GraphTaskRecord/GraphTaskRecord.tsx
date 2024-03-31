import React, { useEffect, useMemo, useState } from 'react';
import TaskList from '../taskList';
import _ from 'lodash';
import { PERMISSION_KEYS } from '@/enums';
import servicesPermission from '@/services/rbacPermission';
import serviceGraphDetail from '@/services/graphDetail';
import { message } from 'antd';
import { getParam } from '@/utils/handleFunction';
import AdExitBar from '@/components/AdExitBar/AdExitBar';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { ad_onChangeGraphStatus } from '@/reduxConfig/action/knowledgeGraph';
import { connect } from 'react-redux';

const GraphTaskRecord = ({ ad_onChangeGraphStatus }: any) => {
  const [graphBasicData, setGraphBasicData] = useState({});
  const history = useHistory();
  const graphId = useMemo(() => getParam('graphId'), []);
  const graphName = useMemo(() => getParam('graphName'), []);
  const knId = useMemo(() => getParam('knId'), []);

  useEffect(() => {
    getGraphDataById();
  }, []);

  const getGraphDataById = async () => {
    try {
      const getData = { is_all: true, graph_id: graphId };
      const result = await serviceGraphDetail.graphGetInfoBasic(getData);
      const data = result?.res || {};
      const postData = { dataType: PERMISSION_KEYS.TYPE_KG, dataIds: [String(graphId)] };
      // servicesPermission.dataPermission(postData).then(result => {
      //   setGraphBasicData({ ...data, __codes: result?.res?.[0]?.codes || [] });
      // });
      setGraphBasicData(data);
    } catch (error) {
      const { type, response } = error;
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  const onExit = () => {
    history.push(`/knowledge/studio-network?id=${knId}&gid=${graphId}&gcid=${graphId}`);
  };

  return (
    <div className="GraphTaskRecord kw-flex-item-full-height kw-flex-column">
      <AdExitBar title={`${intl.get('knowledge.taskManagement')}：${graphName}`} onExit={onExit} />
      {!_.isEmpty(graphBasicData) && (
        <TaskList
          tabsKey="task"
          selectedGraph={graphBasicData}
          onUpdateGraphStatus={(status: any) => {
            ad_onChangeGraphStatus({ ad_graphStatus: status });
          }}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state: any) => {
  return {
    ad_graphStatus: state?.getIn(['knowledgeGraph'])?.toJS()?.ad_graphStatus || ''
  };
};
const mapDispatchToProps = (dispatch: any) => ({
  ad_onChangeGraphStatus: (payload: any) => dispatch(ad_onChangeGraphStatus(payload))
});

export default connect(mapStateToProps, mapDispatchToProps)(GraphTaskRecord);
