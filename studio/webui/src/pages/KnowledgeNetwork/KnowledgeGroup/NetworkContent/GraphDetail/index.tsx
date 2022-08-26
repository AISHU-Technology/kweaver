import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Button, message } from 'antd';

import { GRAPH_STATUS } from '@/enums';
import serviceGraphDetail from '@/services/graphDetail';

import GraphG6 from './GraphG6';
import Menus from './Menus';

import empty from '@/assets/images/empty.svg';
import './style.less';

type GraphDetailType = {
  graphid: number;
  tabsKey: string;
  isFetching: boolean;
  graphBasicData: { [key: string]: any };
};
const GraphDetail = (props: GraphDetailType) => {
  const history = useHistory();
  const { graphid, tabsKey, isFetching, graphBasicData } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [selectedData, setSelectedData] = useState({});
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [] });
  const [graphCount, setGraphCount] = useState({ nodes: [], edges: [], nodeCount: 0, edgeCount: 0 });

  useEffect(() => {
    if (!(graphid && tabsKey === '1')) return;
    getData();
  }, [graphid, tabsKey]);
  useEffect(() => {
    if (isFetching) getData();
  }, [isFetching]);

  const getData = async () => {
    try {
      setIsLoading(true);
      // 配置中不查询数量和本体
      const isConfiguration = graphBasicData.status === GRAPH_STATUS.CONFIGURATION;
      if (isConfiguration) return setIsLoading(false);

      let resultCount: any = { res: { entity: [], edge: [], entity_count: 0, edge_count: 0 } };
      // 运行中和运行失败不查询数量信息
      if (graphBasicData.status !== GRAPH_STATUS.RUNNING && graphBasicData.status !== GRAPH_STATUS.FAIL) {
        try {
          resultCount = await serviceGraphDetail.graphGetInfoCount({ graph_id: graphid });
        } catch (error) {
          // console.log('error', error);
        }
        const { entity = [], edge = [], entity_count = 0, edge_count = 0 } = resultCount?.res || {};
        setGraphCount({ nodes: entity, edges: edge, nodeCount: entity_count, edgeCount: edge_count });
      }

      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: graphid });
      const nodesKV: any = _.keyBy(resultCount?.res?.entity, 'name') || {};
      const edgesKV: any = _.keyBy(resultCount?.res?.edge, 'name') || {};

      const nodes = _.map(resultOnto?.res?.entity || [], item => {
        const count = nodesKV?.[item.name]?.count || 0;
        return { ...item, count, uid: item.name };
      });
      const edges = _.map(resultOnto?.res?.edge || [], item => {
        const count = edgesKV?.[item.name]?.count || 0;
        return { ...item, count, uid: item?.relation?.join('->') };
      });
      setIsLoading(false);
      setGraphData({ nodes, edges });
    } catch (error) {
      setIsLoading(false);
      const { type, response } = error as any;
      if (type === 'message') message.error(response?.description || '');
    }
  };

  const onChangeData = (item: any) => {
    setSelectedData(item);
  };

  const editGraph = async () => {
    const { kg_conf_id, status, is_upload } = graphBasicData;

    if (status === GRAPH_STATUS.RUNNING) return message.warning(intl.get('graphList.needRun'));
    if (status === GRAPH_STATUS.WAITING) return message.warning(intl.get('graphList.needWait'));
    if (is_upload) return message.warning(intl.get('graphList.uploadErr'));

    try {
      if (status === GRAPH_STATUS.CONFIGURATION) {
        history.push(`/home/workflow/edit?id=${kg_conf_id}&status=${GRAPH_STATUS.CONFIGURATION}`);
      } else {
        history.push(`/home/workflow/edit?id=${kg_conf_id}&status=${GRAPH_STATUS.NORMAL}`);
      }
    } catch (error) {
      // console.log(error)
    }
  };

  return (
    <div className="graphDetailRoot">
      <div className="graphBox">
        {isFetching || isLoading ? null : graphBasicData.status === GRAPH_STATUS.CONFIGURATION ? (
          <div className="empty">
            <img className="ad-mb-2" src={empty} />
            <div>{intl.get('graphDetail.noContentPleaseConfiguration')}</div>
            <Button type="link" onClick={editGraph}>
              {intl.get('graphDetail.enterTheMapConstructionProcess')}
            </Button>
          </div>
        ) : graphData?.nodes?.length ? (
          <GraphG6 graphData={graphData} onChangeData={onChangeData} />
        ) : null}
        <Menus
          selectedData={selectedData}
          graphid={graphid}
          graphData={graphData}
          graphCount={graphCount}
          graphBasicData={graphBasicData}
        />
      </div>
    </div>
  );
};

export default GraphDetail;
