import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { Button, message } from 'antd';

import HELPER from '@/utils/helper';
import { GRAPH_STATUS } from '@/enums';
import serviceGraphDetail from '@/services/graphDetail';

import ContainerIsVisible from '@/components/ContainerIsVisible';
import GraphG6 from './GraphG6';
import Menus from './Menus';

import empty from '@/assets/images/empty.svg';
import './style.less';

type GraphDetailType = {
  graphid: number;
  tabsKey: string;
  isFetching: boolean;
  graphBasicData: { [key: string]: any };
  selectedKnowledge?: any;
};
const GraphDetail = (props: GraphDetailType) => {
  const history = useHistory();
  const { graphid, tabsKey, isFetching, graphBasicData, selectedKnowledge } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [selectedData, setSelectedData] = useState({});
  const [graphData, setGraphData] = useState<any>({ nodes: [], edges: [] });
  const [graphCount, setGraphCount] = useState({ nodes: [], edges: [], nodeCount: 0, edgeCount: 0 });
  const menusRef = useRef<any>();
  useEffect(() => {
    if (!graphid) return;
    getData();
  }, [graphid, tabsKey, graphBasicData?.status]);
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
      // WARNING 运行中不查询数量信息, nebula运行失败查询会报错 直接返回空
      // if (graphBasicData.status !== GRAPH_STATUS.RUNNING) {
      try {
        resultCount = await serviceGraphDetail.graphGetInfoCount({ graph_id: graphid });
      } catch (error) {}
      const { entity = [], edge = [], entity_count = 0, edge_count = 0 } = resultCount?.res || {};
      setGraphCount({ nodes: entity, edges: edge, nodeCount: entity_count, edgeCount: edge_count });
      // }
      const resultOnto = await serviceGraphDetail.graphGetInfoOnto({ graph_id: graphid });
      const nodesKV: any = _.keyBy(resultCount?.res?.entity, 'name') || {};
      const edgesKV: any = _.keyBy(resultCount?.res?.edge, 'name') || {};

      const __nodes = _.map(resultOnto?.res?.entity || [], item => {
        const count = nodesKV?.[item.name]?.count || 0;
        return { ...item, count, uid: item.name };
      });
      const __edges = _.map(resultOnto?.res?.edge || [], item => {
        const count = edgesKV?.[item.name]?.count || 0;
        return { ...item, count, uid: item?.relation?.join('->') };
      });

      const nodes = __nodes.sort((a, b) => b.count - a.count);
      const edges = __edges.sort((a, b) => b.count - a.count);

      setIsLoading(false);
      setGraphData({ nodes, edges });
    } catch (error) {
      setIsLoading(false);
      const { type, response } = error as any;
      if (type === 'message') message.error(response?.Description || '');
    }
  };

  const onChangeData = (item: any) => {
    if (_.isEmpty(item)) {
      menusRef.current.closeDrawer();
    }
    setSelectedData(item);
  };

  const editGraph = async () => {
    const { status, id } = graphBasicData;

    if (status === GRAPH_STATUS.RUNNING) return message.warning(intl.get('graphList.needRun'));
    if (status === GRAPH_STATUS.WAITING) return message.warning(intl.get('graphList.needWait'));
    // if (is_upload) return message.warning(intl.get('graphList.uploadErr'));

    try {
      if (status === GRAPH_STATUS.CONFIGURATION) {
        const url = `id=${id}&knId=${selectedKnowledge?.id}&status=${GRAPH_STATUS.CONFIGURATION}`;
        history.push(`/knowledge/workflow/edit?${url}`);
      } else {
        const url = `id=${id}&knId=${selectedKnowledge?.id}&status=${GRAPH_STATUS.NORMAL}`;
        history.push(`/knowledge/workflow/edit?${url}`);
      }
    } catch (error) {}
  };

  return (
    <div className="graphDetailRoot kw-w-100 kw-h-100">
      <div className="graphBox">
        {isFetching || isLoading ? null : graphBasicData.status === GRAPH_STATUS.CONFIGURATION ? (
          <div className="empty" onClick={() => menusRef.current.closeDrawer()}>
            <img className="kw-mb-2" src={empty} />
            <ContainerIsVisible placeholder={<div>{intl.get('global.noContent')}</div>}>
              <React.Fragment>
                <div>{intl.get('graphDetail.noContentPleaseConfiguration')}</div>
                <Button type="link" onClick={editGraph}>
                  {intl.get('graphDetail.enterTheMapConstructionProcess')}
                </Button>
              </React.Fragment>
            </ContainerIsVisible>
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
          ref={menusRef}
        />
      </div>
    </div>
  );
};

export default GraphDetail;
