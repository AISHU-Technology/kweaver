import React, { useRef, useState, useEffect } from 'react';
import _ from 'lodash';

import useGraph from '@/hooks/useGraph';
import { getParam } from '@/utils/handleFunction';
import visualAnalysis from '@/services/visualAnalysis';
import analysisService from '@/services/analysisService';

import { SourceType } from './type';
import { formatGraphData_graphSearchVid, formatGraphData_servicesTest } from './assistant';
import GraphContainer from './GraphContainer';

import './style.less';

const TemplateDataAssetInventory = (props: any) => {
  const { serviceInfo } = props;
  const [graphInstance] = useGraph();
  const params = getParam();

  const [serviceData, setServiceData] = useState<any>({});
  const [sourceData, setSourceData] = useState<SourceType>({ nodes: [], edges: [] });

  useEffect(() => {
    if (!serviceInfo?.id) return;
    getServiceData(serviceInfo?.id);
  }, [serviceInfo?.id]);

  /** 获取服务数据 */
  const getServiceData = async (id: string) => {
    let result: any = null;
    try {
      const { res } = (await analysisService.analysisServiceGet(id)) || {};
      result = res;
    } catch (error) {}
    try {
      const canvas_body = JSON.parse(result?.canvas_body || '{}');
      const canvas_config = JSON.parse(result?.canvas_config || '{}');
      const document = JSON.parse(result?.document || '{}');
      const pc_configure_item = JSON.parse(result?.pc_configure_item || '{}');
      const newServiceData = { ...result, canvas_body, canvas_config, document, pc_configure_item };
      setServiceData(newServiceData);
      if (!params?.vids) return;
      getResult(newServiceData);
    } catch (error) {}
  };

  /** 获取查询结果*/
  const getResult = async (data: any) => {
    try {
      const vids = _.filter(new URLSearchParams(window.location.search).getAll('vids'), v => !!v);
      if (!vids[0]) return;

      const param = { kg_id: data.kg_id, vids: [vids?.[0]], page: 1, size: 1, search_config: [] };
      const { res: rootData } = await visualAnalysis.vidRetrieval(param);
      const root = formatGraphData_graphSearchVid(rootData?.nodes || [])?.[0];

      const config_info = {
        vids: [vids?.[0]],
        filters: data?.config_info?.filters || [],
        direction: params?.direction || 'reverse',
        steps: parseInt(params?.steps, 10) || 1
      };
      const body = { knw_id: data.knw_id, kg_id: data.kg_id, operation_type: data.operation_type, config_info };
      const { res: childrenData } = await analysisService.analysisServiceTest(body);
      const graphData = formatGraphData_servicesTest(childrenData, root.id);

      const hasRoot = _.filter(graphData.nodes, item => item.id === root.id)?.[0];
      if (hasRoot) {
        graphData.nodes = _.map(graphData.nodes, item => {
          if (item.id !== root.id) return item;
          return { ...item, _isRoot: true };
        });
      } else {
        graphData.nodes.push({ ...root, _isRoot: true });
      }

      setSourceData(graphData);
    } catch (error) {}
  };

  return (
    <div className="dataAssetInventoryRoot">
      <GraphContainer
        graphInstance={graphInstance}
        sourceData={sourceData}
        graphStyle={serviceData?.canvas_body?.graphStyle}
      />
    </div>
  );
};

export default TemplateDataAssetInventory;
