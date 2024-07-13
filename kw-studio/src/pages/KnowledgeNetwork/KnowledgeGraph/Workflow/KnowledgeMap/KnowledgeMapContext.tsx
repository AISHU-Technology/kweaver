import React, { createContext, useContext, useEffect, useRef } from 'react';
import HOOKS from '@/hooks';
import { Updater, GetStateAction } from '@/hooks/useImmerState';
import type { GraphData, NodeConfig, EdgeConfig } from '@antv/g6';
import type { Cell } from '@antv/x6';
import {
  DataFileType,
  G6NodeData,
  G6EdgeData,
  GraphKMapType,
  ExtractModel,
  DataFileErrorsProps,
  Flow4ErrorType
} from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/types';
import serviceWorkflow from '@/services/workflow';
import { getParam } from '@/utils/handleFunction';
import { DsSourceItem } from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/types';
import _ from 'lodash';
import { useLocation } from 'react-router-dom';

const { useImmerState, useLatestState } = HOOKS;

type SelectedG6EdgeProps = {
  edgeData: G6EdgeData;
  startNodeData: G6NodeData;
  endNodeData: G6NodeData;
};

type InitialStateProps = {
  selectedG6ModelNode: G6NodeData[];
  selectedG6ModelEdge: SelectedG6EdgeProps[];
  selectedG6Node: G6NodeData[];
  selectedG6Edge: SelectedG6EdgeProps[];
  selectedModel: ExtractModel[]; // 选中的模型
  graphId?: number;
  graphName?: string;
  graphDataSource?: DsSourceItem[];
  ontologyData: { entity: any[]; edge: any[] }[];
  ontologyDisplayType: 'g6' | 'list';
  currentDataFile: DataFileType[]; // currentDataFile 中的元素理解为一个个数据源，只有模型抽取才会同时映射多个数据源
  graphG6Data: GraphData;
  graphKMap: GraphKMapType;
  cacheGraphX6Data: Record<string, Cell.Properties[]>;
  g6RelationDataFileObj: Record<string, DataFileType | string>;
  helpTips: string[];
  currentStep: number;
  firstAddFile: boolean;
  flow4ErrorList: Flow4ErrorType[];
  flow4Visible: boolean;
  viewMode: boolean;
};
const initialState: InitialStateProps = {
  graphId: undefined, // 当前知识图谱的ID
  graphName: '', // 当前知识图谱的名称
  graphDataSource: [], // 当前知识图谱身上的数据源（流程二选中的数据源）
  ontologyData: [], //  当前知识图谱中流程三的本体数据源（G6数据是整个知识图谱中的一部分）
  ontologyDisplayType: 'g6', // 本体的展现形式（G6形式或者普通列表形式）
  graphG6Data: { nodes: [], edges: [] }, // 绘制G6图谱所需的数据结构（该数据由ontologyData生成）
  selectedG6Node: [], // 选中的G6节点
  selectedG6Edge: [], // 选中的G6边
  selectedModel: [], // 选中的模型
  selectedG6ModelNode: [], // 选中的G6模型节点
  selectedG6ModelEdge: [], // 选中的G6模型边
  currentDataFile: [], // 当前正在操作的数据文件信息 (只有模型抽取才会有多个文件)
  graphKMap: { entity: [], edge: [], files: [] } as GraphKMapType, // 最终保存到后端的映射数据字段
  cacheGraphX6Data: {}, // 键值对形式缓存x6中的所有节点和边数据(从该数据中获取上次节点的位置信息)--键就是G6中节点或边的name
  g6RelationDataFileObj: {}, // 键值对形式缓存G6中所有已经关联数据文件的节点或者边，键就是G6中节点或边的name，值就是关联的数据文件
  helpTips: [], // 帮助提示
  currentStep: 0, // 当前的步骤，只有一个作用去触发useEffect的重新执行（当从点击上一步的时候  该属性就会起重新获取数据的作用）
  firstAddFile: false, // 是否是第一次添加文件
  flow4ErrorList: [], // 流程四错误信息数据源
  flow4Visible: false, // 流程四是否显示过
  viewMode: false // 当前是否处于查看模式
};

interface ContextProps {
  knowledgeMapStore: InitialStateProps;
  setKnowledgeMapStore: Updater<InitialStateProps>;
  getLatestStore: GetStateAction<InitialStateProps>; // 获取store中最新的数据
}

const context = createContext({} as ContextProps);

context.displayName = 'knowledgeMapStore';

export const useKnowledgeMapContext = () => useContext(context);

interface KnowledgeMapContextProps {
  currentStep: number;
  children?: any;
}

const KnowledgeMapContext: React.FC<KnowledgeMapContextProps> = ({ children, currentStep }) => {
  const [store, setStore, getLatestStore] = useImmerState<InitialStateProps>(initialState);
  const location = useLocation<any>();

  useEffect(() => {
    setStore(preState => ({
      ...preState,
      viewMode: location.state?.mode === 'view'
    }));
  }, []);

  useEffect(() => {
    const graphId = parseInt(getParam('id'));
    if (graphId && currentStep === 3) {
      getGraphByGraphId(graphId);
    }
  }, [currentStep]);

  /**
   * 根据图谱ID重新获取图谱数据
   * @param graphId
   */
  const getGraphByGraphId = async (graphId: number) => {
    const res = await serviceWorkflow.graphGet(graphId);
    if (res && res.res) {
      // const basicData = res.res.graph_baseInfo[0];
      const basicData = res.res.graph_baseInfo;
      const graphDataSource = res.res.graph_ds;
      const ontologyData = res.res.graph_otl;
      const graph_KMap = res.res.graph_KMap;
      if (ontologyData.length === 0) return;
      const graphKMap = getGraphKMapData(ontologyData, graph_KMap);
      setStore(preState => ({
        ...preState,
        graphId,
        graphName: basicData.graph_Name,
        graphDataSource,
        ontologyData,
        graphKMap,
        currentStep,
        flow4Visible: true
      }));
    }
  };

  const getGraphKMapData = (ontologyData: any, graph_KMap: GraphKMapType) => {
    const graphKMap = { entity: [], edge: [], files: [] } as GraphKMapType;
    if (Object.keys(graph_KMap).length > 0) {
      // 根据已存在的映射数据与最新的本体数据去组合生成最新的映射数据
      graphKMap.entity = graph_KMap.entity.map((item: any) => ({
        name: item.name,
        entity_type: item.entity_type,
        x: item.x,
        y: item.y,
        property_map: item.property_map
      }));
      graphKMap.edge = graph_KMap.edge.map((item: any) => ({
        relations: item.relations,
        entity_type: item.entity_type,
        property_map: item.property_map,
        relation_map: item.relation_map
      }));
      graphKMap.files = graph_KMap.files.map((item: any) => {
        const obj = {
          ...item
        };
        delete obj.ds_name;
        return obj;
      });
    }
    const { entity, edge } = ontologyData[0];
    // 根据本体数据去组合生成最新的映射数据
    const exitEntityNames = graphKMap.entity.map(entity => entity.name);
    entity?.forEach((item: any) => {
      if (!exitEntityNames.includes(item.name)) {
        graphKMap.entity.push({
          name: item.name,
          // 模型身上的实体类，entity_type 就是实体类的name
          // entity_type: item.model ? item.name : '',
          entity_type: '',
          x: item.x,
          y: item.y,
          property_map: item.properties.map((props: any) => ({
            entity_prop: '',
            otl_prop: props.name
          }))
        });
      }
    });
    const exitEdges = graphKMap.edge.map(edge => edge.relations);
    edge?.forEach((item: any) => {
      if (!exitEdges.some(exitEdge => _.isEqual(exitEdge, item.relations))) {
        graphKMap.edge.push({
          relations: item.relations,
          // 模型身上的关系类，entity_type 就是关系类的name
          // entity_type: item.model ? item.name : '',
          entity_type: '',
          property_map: item.properties.map((props: any) => ({
            entity_prop: '',
            edge_prop: props.name
          })),
          relation_map: {
            begin_class_prop: '',
            equation_begin: '',
            relation_begin_pro: '',
            equation: '',
            relation_end_pro: '',
            equation_end: '',
            end_class_prop: ''
          }
        });
      }
    });
    return graphKMap;
  };

  return (
    <context.Provider value={{ knowledgeMapStore: store, setKnowledgeMapStore: setStore, getLatestStore }}>
      {children}
    </context.Provider>
  );
};

export default KnowledgeMapContext;
