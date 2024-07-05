import { CSSProperties } from 'react';
import type { Graph, INode, IEdge, NodeConfig, EdgeConfig } from '@antv/g6';

const ExtractModels = [
  'AImodel',
  'Generalmodel',
  'Contractmodel',
  'Anysharedocumentmodel',
  'OperationMaintenanceModel'
] as const;

export type KwModelType = (typeof ExtractModels)[number];

type KwNodePropertiesType = {
  name: string;
  alias: string;
  synonym: string;
  data_type: string;
  description: string;
};

type KwEdgePropertiesType = KwNodePropertiesType;

export interface KwBackEndNodeDataProps {
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  size: string;
  icon: string;
  name: string;
  alias: string;
  shape: string;
  synonym: string;
  task_id: string;
  text_type: string;
  text_width: number;
  text_color: string;
  entity_id?: string;
  fill_color: string;
  icon_color: string;
  default_tag: string;
  description: string;
  source_type: string;
  stroke_color: string;
  text_position: string;
  primary_key: string[];
  model: KwModelType | '';
  properties_index: string[];
  index_main_switch: boolean;
  vector_generation: string[];
  index_default_switch: boolean;
  properties: KwNodePropertiesType[];
}

export interface KwBackEndEdgeDataProps {
  name: string;
  alias: string;
  width: string;
  shape: string;
  colour: string;
  synonym: string;
  edge_id?: string;
  source_type: string;
  default_tag: string;
  description: string;
  relations: string[];
  model: KwModelType | '';
  properties_index: string[];
  index_main_switch: boolean;
  index_default_switch: boolean;
  properties: KwEdgePropertiesType[];
}

export type KwBackEndOntologyDataProps = {
  edge: KwBackEndEdgeDataProps[];
  entity: KwBackEndNodeDataProps[];
};

export type G6NodeSourceDataAttributesProps = {
  attrName: string;
  attrType: string;
  attrIndex: boolean;
  attrMerge: boolean;
  attrVector: boolean;
  attrDescribe: string;
  attrSynonyms: string[];
  attrDisplayName: string;
};

export interface ReactG6NodeSourceDataProps
  extends Omit<
    KwBackEndNodeDataProps,
    | 'size'
    | 'shape'
    | 'synonym'
    | 'text_type'
    | 'properties'
    | 'text_width'
    | 'text_color'
    | 'fill_color'
    | 'icon_color'
    | 'description'
    | 'stroke_color'
    | 'text_position'
    | 'index_main_switch'
    | 'index_default_switch'
  > {
  uid: string;
  properties: Array<string[]>;
  attributes: G6NodeSourceDataAttributesProps[];
  describe: string;
  synonyms: string[];
  size: number;
  type: string;
  labelType: 'fixed' | 'adapt';
  labelLength: number;
  position: string;
  source_table: any[];
  labelFill: string;
  color: string;
  fillColor: string;
  strokeColor: string;
  iconColor: string;
  showLabels: Array<{
    key: string;
    alias: string;
    value: string;
    type: string;
    isChecked: boolean;
    isDisabled: boolean;
  }>;
  switchDefault: boolean;
  switchMaster: boolean;
  fx?: number;
  fy?: number;
  hasError?: any[];

  [key: string]: any;
}

export type G6EdgeSourceDataAttributesProps = {
  attrName: string;
  attrDisplayName: string;
  attrType: string;
  attrIndex: boolean;
  attrSynonyms: string[];
  attrDescribe: string;
  error?: any;
};

export interface ReactG6EdgeSourceDataProps
  extends Omit<
    KwBackEndEdgeDataProps,
    | 'colour'
    | 'description'
    | 'properties'
    | 'width'
    | 'synonym'
    | 'shape'
    | 'index_default_switch'
    | 'index_main_switch'
  > {
  uid: string;
  attributes: G6EdgeSourceDataAttributesProps[];
  color: string;
  describe: string;
  properties: Array<string[]>;
  source: string;
  target: string;
  startId: string;
  endId: string;
  size: number;
  synonyms: string[];
  type: string;
  switchDefault: boolean;
  switchMaster: boolean;
  lineWidth?: number;
  hasError?: any[];
  fillColor?: string;
  strokeColor?: string;

  [key: string]: any;
}

export interface ReactG6GraphSourceDataProps {
  nodes: ReactG6NodeSourceDataProps[];
  edges: ReactG6EdgeSourceDataProps[];
}

export interface ReactG6NodeDataProps extends KwOmit<NodeConfig, 'icon'> {
  icon: string;
  _sourceData: ReactG6NodeSourceDataProps;
}

export interface ReactG6EdgeDataProps extends EdgeConfig {
  hasError?: any[];
  _sourceData: ReactG6EdgeSourceDataProps;
}

export interface ReactG6GraphDataProps {
  nodes: ReactG6NodeDataProps[];
  edges: ReactG6EdgeDataProps[];
}

export interface ReactG6EventBase {
  graphInstance: Graph;
}

export interface ReactG6NodeEvent extends ReactG6EventBase {
  nodeData: ReactG6NodeDataProps;
  nodeInstance: INode;
}

export interface ReactG6EdgeEvent extends ReactG6EventBase {
  edgeData: ReactG6EdgeDataProps;
  edgeInstance: IEdge;
}

export interface ReactG6CanvasEvent extends ReactG6EventBase {
  graphData: ReactG6GraphDataProps;
}

export interface ReactG6ItemsEvent extends ReactG6EventBase {
  itemData: Array<ReactG6NodeDataProps | ReactG6EdgeDataProps>;
}

export interface KwReactG6Props {
  style?: CSSProperties;
  className?: string;
  data: KwBackEndOntologyDataProps;
  toolVisible?: boolean;

  selectedItem?: Array<ReactG6NodeDataProps | ReactG6EdgeDataProps>;
  onItemSelect?: (param: ReactG6ItemsEvent) => void;

  onNodeClick?: (param: ReactG6NodeEvent) => void;
  onEdgeClick?: (param: ReactG6EdgeEvent) => void;
  onCanvasClick?: (param: ReactG6CanvasEvent) => void;
  onNodeDragend?: (param: ReactG6NodeEvent) => void;
}

export interface KwReactG6RefProps {
  graphInstance: Graph;
  highlightNode: (nodeData: ReactG6NodeDataProps) => void;
  highlightEdge: (edgeData: ReactG6EdgeDataProps) => void;
  clearHighlightItem: () => void;
}

export type ResizeProps = {
  width: number;
  height: number;
};
