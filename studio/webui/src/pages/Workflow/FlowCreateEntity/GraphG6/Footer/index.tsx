import React, { useRef } from 'react';
import { Button, message, ConfigProvider } from 'antd';
import intl from 'react-intl-universal';
import servicesCreateEntity from '@/services/createEntity';
import servicesSubGraph from '@/services/subGraph';
import { generateGroupBody, generateGraphBody } from '../assistant';
import { GraphData } from '../types/data';
import { GraphGroupItem } from '../types/items';
import './style.less';

export interface FooterProps {
  prev: Function;
  next: Function;
  graphId: number;
  ontologyId: number;
  groupList: GraphGroupItem[];
  graphData: GraphData;
  initOntoData: Record<string, any>;
  dataInfoRef: any;
  onCheckErr: () => void;
}

const Footer = (props: FooterProps) => {
  const { prev, next, graphId, ontologyId, groupList, graphData, initOntoData, dataInfoRef, onCheckErr } = props;
  const signalNext = useRef(false);

  /**
   * 校验保存数据
   */
  const checkSaveData = (graph: GraphData) => {
    const { nodes, edges } = graph;

    if (nodes.length === 0) {
      message.warning([intl.get('createEntity.hasNode')]);
      return true;
    }

    const checkNodes = [...nodes, ...edges];
    const checkEdges = [...edges, ...nodes];
    const reg = /^\w+$/;
    const maxLength = 50;

    for (let i = 0, { length } = nodes; i < length; i++) {
      for (let j = 0, { length } = checkNodes; j < length; j++) {
        if (
          (nodes[i].name &&
            checkNodes[j].name &&
            nodes[i]?.name?.toLowerCase() === checkNodes[j]?.name?.toLowerCase() &&
            i !== j) ||
          !reg.test(nodes[i].name) ||
          nodes[i].name.length > maxLength ||
          (nodes[i]?.alias?.toLowerCase() === checkNodes[j]?.alias?.toLowerCase() && i !== j && i < nodes.length - 1)
        ) {
          onCheckErr();
          return true;
        }
      }
    }

    for (let i = 0, { length } = edges; i < length; i++) {
      for (let j = 0, { length } = checkEdges; j < length; j++) {
        if (
          (edges[i].name &&
            checkEdges[j].name &&
            edges[i]?.name?.toLowerCase() === checkEdges[j]?.name?.toLowerCase() &&
            edges[i].relations[0] === checkEdges[j].relations[0] &&
            edges[i].relations[2] === checkEdges[j].relations[2] &&
            i !== j) ||
          !reg.test(edges[i].name) ||
          edges[i].name?.length > maxLength
        ) {
          onCheckErr();
          return true;
        }
      }
    }

    return false;
  };

  /**
   * 流程三检验数据
   */
  const saveFlowData = async (type: string) => {
    const { entity, edge } = generateGraphBody(graphData);
    if (checkSaveData({ nodes: entity, edges: edge }) || signalNext.current) return;

    const { used_task = [], ontology_id } = initOntoData;
    // ontology_id为编辑状态时获取到的本体id ontologyId为创建本体时拿到的id
    const data: Record<string, any> = {
      entity,
      edge,
      used_task,
      id: ontology_id || ontologyId,
      ontology_id: String(ontology_id || ontologyId),
      flag: type === 'check' ? 'save' : 'nextstep',
      ontology_name: '',
      ontology_des: ''
    };

    const requestData = {
      graph_step: 'graph_otl',
      updateoradd: 'update_otl_info',
      graph_process: [data]
    };

    // 如果输入栏有错误，则取消操作
    if (dataInfoRef) {
      if (dataInfoRef.state.checkData.isIncorrect) {
        message.error(intl.get('createEntity.de'));
        dataInfoRef.setActiveKey(['1', '2', '3']);
        return;
      }

      if (dataInfoRef.formNameRef.current) {
        dataInfoRef.formNameRef.current
          .validateFields()
          .then(async () => {
            signalNext.current = true;
            const resData = (await servicesCreateEntity.changeFlowData(graphId, requestData)) || {};
            signalNext.current = false;

            if (resData.res) {
              if (type === 'check') {
                message.success(intl.get('createEntity.vc'));
              }

              if (type === 'next') {
                const groupBody = generateGroupBody(groupList, { nodes: entity, edges: edge }, true);
                const { res, error, Description } = (await servicesSubGraph.subgraphEdit(graphId, groupBody)) || {};
                if (res) {
                  next();
                  return;
                }
                if (error?.[0]) {
                  const { Description } = error[0];
                  Description && message.error(Description);
                }
                Description && message.error(Description);
              }
              return;
            }

            if (resData.Code === 500026) {
              message.warning(intl.get('createEntity.predicting'));
            }
            next(resData);
          })
          .catch(() => {
            signalNext.current = false;
            message.error(intl.get('createEntity.de'));
            dataInfoRef.setActiveKey(['1', '2', '3']);
          });
      }
      return;
    }
    signalNext.current = true;
    const resData = (await servicesCreateEntity.changeFlowData(graphId, requestData)) || {};
    // eslint-disable-next-line require-atomic-updates
    signalNext.current = false;
    if (resData.res) {
      if (type === 'check') {
        message.success([intl.get('createEntity.vc')]);
      }

      if (type === 'next') {
        const groupBody = generateGroupBody(groupList, { nodes: entity, edges: edge }, true);
        const { res, error, Description } = (await servicesSubGraph.subgraphEdit(graphId, groupBody)) || {};
        if (res) {
          next();
          return;
        }
        if (error?.[0]) {
          const { Description } = error[0];
          Description && message.error(Description);
        }
        Description && message.error(Description);
      }
      return;
    }

    if (resData.Code === 500026) {
      message.warning([intl.get('createEntity.predicting')]);
    }
    next(resData);
  };

  return (
    <div className="work-flow-footer">
      <ConfigProvider autoInsertSpaceInButton={false}>
        <Button className="btn" onClick={() => prev()}>
          {intl.get('createEntity.previous')}
        </Button>

        <Button className="btn" type="primary" onClick={() => saveFlowData('check')}>
          {intl.get('createEntity.check')}
        </Button>

        <Button className="btn" onClick={() => saveFlowData('next')}>
          {intl.get('createEntity.next')}
        </Button>
      </ConfigProvider>
    </div>
  );
};

export default Footer;
