import { CSSProperties } from 'react';
import type { Graph, INode, IEdge, NodeConfig, EdgeConfig, GraphData } from '@antv/g6';

const ExtractModels = [
  'Contractmodel',
  'OperationMaintenanceModel',
  'Anysharedocumentmodel',
  'AImodel',
  'Generalmodel'
] as const;

export type AdModelType = (typeof ExtractModels)[number];

type AdNodePropertiesType = {
  name: string; // Property name
  alias: string; // Property display name
  data_type: string; // Property data type
  synonym: string; // Property synonyms, multiple synonyms separated by commas
  description: string; // Property description
};

type AdEdgePropertiesType = AdNodePropertiesType;

// Entity class returned by the backend
export interface AdBackEndNodeDataProps {
  name: string; // Entity class name
  alias: string; // Entity class display name
  default_tag: string; // Default display properties
  description: string; // Entity class description
  entity_id?: string; // Entity class id
  fill_color: string; // Entity background color
  icon: string; // Entity icon
  icon_color: string; // Entity icon color
  index_default_switch: boolean; // Whether to select index by default when adding property
  index_main_switch: boolean; // Control the index of all properties
  model: AdModelType | ''; //  The source model name of the entity class
  vector_generation: string[]; // vector of entity classes
  primary_key: string[]; // Fusion properties
  properties: AdNodePropertiesType[]; // Entity class properties
  properties_index: string[]; // Entity class index
  shape: string; // The shape of the entity class node
  size: string; // The size of the entity class node
  source_type: string;
  stroke_color: string; // Border color of entity class nodes
  synonym: string; // Entity class synonyms, multiple synonyms separated by commas
  task_id: string; // Entity task id
  text_color: string; // Text color of entity node label
  text_position: string; // Text position of entity class node label
  text_type: string;
  text_width: number; // The max number of characters of the entity node label
  x: number; // The coordinate x of the entity class in the canvas
  y: number; // The coordinate y of the entity class in the canvas
  fx?: number;
  fy?: number;
}

// Edge class returned by the backend
export interface AdBackEndEdgeDataProps {
  name: string; // Relationship class name, duplicates are allowed, edges can be copied
  alias: string; // Relationship class display name
  colour: string; // Edge color
  default_tag: string; // Default display properties for relationship classes
  description: string; // Description of relationship class
  edge_id?: string; // Use edge relations.join("※") value
  index_default_switch: boolean; // Whether to select index by default when adding property
  index_main_switch: boolean; // Control the index of all properties
  model: AdModelType | ''; //  The source model name of the edge class
  properties: AdEdgePropertiesType[]; // Edge class properties
  properties_index: string[]; // Edge class index
  relations: string[]; // Path to relationship class [start point name ,relationship class name ,end point name]
  shape: string; // The shape of the relationship class edge
  source_type: string;
  synonym: string; // Edge class synonyms, multiple synonyms separated by commas
  width: string; // The thickness of the edge
}

// Ontology data type returned by the backend
export type AdBackEndOntologyDataProps = {
  entity: AdBackEndNodeDataProps[];
  edge: AdBackEndEdgeDataProps[];
};

// ---------------------- Begin：G6 data interface is redefined based on back-end data format ----------------------
export type G6NodeSourceDataAttributesProps = {
  attrName: string;
  attrDisplayName: string;
  attrType: string;
  attrIndex: boolean;
  attrMerge: boolean;
  attrVector: boolean;
  attrSynonyms: string[];
  attrDescribe: string;
};

export interface ReactG6NodeSourceDataProps
  extends Omit<
    AdBackEndNodeDataProps,
    | 'properties'
    | 'description'
    | 'synonym'
    | 'size'
    | 'shape'
    | 'text_type'
    | 'text_width'
    | 'text_position'
    | 'text_color'
    | 'fill_color'
    | 'stroke_color'
    | 'icon_color'
    | 'index_default_switch'
    | 'index_main_switch'
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
    AdBackEndEdgeDataProps,
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

// eslint-disable-next-line no-undef
export interface ReactG6NodeDataProps extends AdOmit<NodeConfig, 'icon'> {
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

// ---------------------- End：G6 data interface is redefined based on back-end data format ----------------------

// ---------------------- Begin：Event interface definition ----------------------
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

// ---------------------- End：Event interface definition ----------------------

// ---------------------- Begin：Component interface definition ----------------------
export interface AdReactG6Props {
  style?: CSSProperties;
  className?: string;
  data: AdBackEndOntologyDataProps; // data source，Backend ontology format
  toolVisible?: boolean;

  selectedItem?: Array<ReactG6NodeDataProps | ReactG6EdgeDataProps>; //  item selected
  onItemSelect?: (param: ReactG6ItemsEvent) => void; // item selected event

  onNodeClick?: (param: ReactG6NodeEvent) => void;
  onEdgeClick?: (param: ReactG6EdgeEvent) => void;
  onCanvasClick?: (param: ReactG6CanvasEvent) => void;
  onNodeDragend?: (param: ReactG6NodeEvent) => void;
}

export interface AdReactG6RefProps {
  graphInstance: Graph;
  highlightNode: (nodeData: ReactG6NodeDataProps) => void;
  highlightEdge: (edgeData: ReactG6EdgeDataProps) => void;
  clearHighlightItem: () => void;
}

export type ResizeProps = {
  width: number;
  height: number;
};
// ---------------------- End：Component interface definition ----------------------
