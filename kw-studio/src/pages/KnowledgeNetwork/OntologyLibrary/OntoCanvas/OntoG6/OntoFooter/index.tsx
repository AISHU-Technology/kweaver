import React, { useState } from 'react';
import { Button, message, ConfigProvider, Tooltip } from 'antd';
import intl from 'react-intl-universal';
import servicesCreateEntity from '@/services/createEntity';
import servicesSubGraph from '@/services/subGraph';
import { generateGroupBody, generateGraphBody, isSameEdge } from '../assistant';
import { verifyProperty } from '../NodeInfo/PropertyList/assistant';
import { GraphData } from '../types/data';
import { GraphGroupItem } from '../types/items';
import './style.less';

export interface FooterProps {
  onSaveDraft: Function;
  graphId: number;
  ontologyId: number;
  groupList: GraphGroupItem[];
  initOntoData: Record<string, any>;
  dataInfoRef: any;
  onCheckErr: () => void;
  setOntoData: (data: any) => void;
  getCanvasGraphData: () => GraphData;
  onSaveAndExit: () => void;
}

const OntoFooter = (props: FooterProps) => {
  const {
    onSaveDraft,
    graphId,
    ontologyId,
    groupList,
    initOntoData,
    dataInfoRef,
    onCheckErr,
    setOntoData,
    getCanvasGraphData,
    onSaveAndExit
  } = props;
  const [loading, setLoading] = useState(false);

  /**
   * 校验保存数据
   */
  const checkSaveData = (graph: GraphData) => {
    const { nodes, edges } = graph;

    if (nodes.length === 0) {
      // message.warning([intl.get('createEntity.hasNode')]);
      message.warning({
        content: [intl.get('createEntity.hasNode')],
        className: 'custom-class',
        style: {
          marginTop: '6vh'
        }
      });
      return true;
    }

    const checkNodes = [...nodes];
    const checkEdges = [...edges];
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
          (nodes[i]?.alias?.toLowerCase() === checkNodes[j]?.alias?.toLowerCase() && i !== j) ||
          !nodes[i].properties_index?.length ||
          !nodes[i].default_tag ||
          verifyProperty(nodes[i].properties).errIndex > -1
        ) {
          onCheckErr();
          return true;
        }
      }
    }

    for (let i = 0, { length } = edges; i < length; i++) {
      for (let j = 0, { length } = checkEdges; j < length; j++) {
        const name1 = edges[i]?.name?.toLowerCase();
        const name2 = checkEdges[j]?.name?.toLowerCase();
        if (
          (name1 === name2 &&
            edges[i]?.relations?.[0] === checkEdges[j]?.relations?.[0] &&
            edges[i]?.relations?.[2] === checkEdges[j]?.relations?.[2] &&
            i !== j) ||
          !reg.test(name1) ||
          name1?.length > maxLength ||
          (name1 === name2 && i !== j && !isSameEdge(edges[i], checkEdges[j])) || // 同名, 但显示名或属性不同
          verifyProperty(edges[i].properties).errIndex > -1
        ) {
          onCheckErr();
          return true;
        }
      }
    }

    return false;
  };

  return (
    <div className="onto-lib-footer">
      <ConfigProvider autoInsertSpaceInButton={false}>
        <Tooltip getPopupContainer={triggerNode => triggerNode.parentElement!} title={intl.get('ontoLib.draftTips')}>
          <Button className="btn" onClick={() => onSaveDraft()}>
            {intl.get('ontoLib.canvasOnto.saveDraft')}
          </Button>
        </Tooltip>
        <Button className="btn" type="primary" onClick={onSaveAndExit}>
          {intl.get('ontoLib.canvasOnto.saveExit')}
        </Button>
      </ConfigProvider>
    </div>
  );
};

export default OntoFooter;
