export interface DefaultPropertyType {
  name: string;
  value: string;
  alias: string;
}

export interface PropertiesType {
  name: string;
  type: string;
  alias: string;
  value: string;
}

export interface NodeType {
  id: string;
  icon: string;
  alias: string;
  color: string;
  properties: PropertiesType[];
  default_property: DefaultPropertyType;
  _class: string;
}

export interface EdgeType {
  id: string;
  alias: string;
  color: string;
  source: string;
  target: string;
  properties: PropertiesType[];
  _class: string;
}

export interface SourceType {
  nodes: NodeType[];
  edges: EdgeType[];
}
