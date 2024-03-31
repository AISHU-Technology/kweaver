# -*- coding:utf-8 -*-
class OntologyConfig():
    def __init__(self, ontology: dict):
        self.ontology = ontology

        self._cached_entity_names = None
        self._cached_edge_names = None
        self._cached_entity_pro_dict = None
        self._cached_edge_pro_dict = None
        self._cached_entity_pro_index = None
        self._cached_edge_pro_index = None
        self._cached_pro_merge = None
        self._cached_source_type_dict = None
        self._cached_model_dict = None
        self._cached_pro_vector = None

    @property
    def entity_names(self) -> list[str]:
        ''' 点类的名称列表 '''
        if self._cached_entity_names is None:
            self._cached_entity_names = [entity['name'] for entity in self.ontology['entity']]
        return self._cached_entity_names

    @property
    def edge_names(self) -> list[str]:
        ''' 关系类的名称列表 '''
        if self._cached_edge_names is None:
            self._cached_edge_names = list(set(edge['name'] for edge in self.ontology['edge']))
        return self._cached_edge_names

    @property
    def entity_pro_dict(self) -> dict:
        '''  {点类名称: {属性名称: 属性类型}} '''
        if self._cached_entity_pro_dict is None:
            self._cached_entity_pro_dict = {
                entity['name']: {prop['name']: prop['data_type']
                                 for prop in entity['properties']}
                for entity in self.ontology['entity']
            }
        return self._cached_entity_pro_dict

    @property
    def edge_pro_dict(self) -> dict:
        ''' {边类名称: {属性名称: 属性类型}} '''
        if self._cached_edge_pro_dict is None:
            self._cached_edge_pro_dict = {
                edge['name']: {prop['name']: prop['data_type']
                               for prop in edge['properties']}
                for edge in self.ontology['edge']
            }
        return self._cached_edge_pro_dict

    @property
    def entity_pro_index(self) -> dict:
        ''' {点类名称: 全文索引属性列表} '''
        if self._cached_entity_pro_index is None:
            self._cached_entity_pro_index = {
                entity['name']: entity['properties_index']
                for entity in self.ontology['entity']}
        return self._cached_entity_pro_index

    @property
    def edge_pro_index(self) -> dict:
        ''' {边类名称: 全文索引属性列表} '''
        if self._cached_edge_pro_index is None:
            self._cached_edge_pro_index = {edge['name']: edge['properties_index']
                                           for edge in self.ontology['edge']}
        return self._cached_edge_pro_index

    @property
    def pro_merge(self) -> dict:
        ''' {点类名称: 融合属性列表} '''
        if self._cached_pro_merge is None:
            self._cached_pro_merge = {entity['name']: entity['primary_key']
                                      for entity in self.ontology['entity']}
        return self._cached_pro_merge

    @property
    def source_type_dict(self) -> dict:
        ''' {点/边名称: source_type}
        source_type可能值： "automatic", "manual"
        '''
        if self._cached_source_type_dict is None:
            self._cached_source_type_dict = {}
            self._cached_source_type_dict.update({
                entity['name']: entity['source_type']
                for entity in self.ontology['entity']
            })
            self._cached_source_type_dict.update({
                edge['name']: edge['source_type']
                for edge in self.ontology['edge']
            })
        return self._cached_source_type_dict

    @property
    def model_dict(self) -> dict:
        ''' {点/边名称: 模型名称} '''
        if self._cached_model_dict is None:
            self._cached_model_dict = {}
            self._cached_model_dict.update({
                entity['name']: entity['model']
                for entity in self.ontology['entity']
            })
            self._cached_model_dict.update({
                edge['name']: edge['model']
                for edge in self.ontology['edge']
            })
        return self._cached_model_dict

    @property
    def pro_vector(self) -> dict:
        ''' {实体类名: 向量属性列表} '''
        if self._cached_pro_vector is None:
            self._cached_pro_vector = {
                entity['name']: entity['vector_generation']
                for entity in self.ontology['entity']}
        return self._cached_pro_vector


class GraphKMapConfig():
    def __init__(self, graph_KMap: dict):
        self.graph_KMap = graph_KMap

        self._cached_entity_type_dict = None
        self._cached_entity_types = None
        self._cached_entity_entity_types = None
        self._cached_edge_entity_types = None
        self._cached_entity_otl = None
        self._cached_entity_info = {}
        self._cached_edge_info = {}

    @property
    def entity_type_dict(self) -> dict:
        ''' 将 graph_KMap['files'] 由列表转换为以 entity_type 为 key 的 dict '''
        if self._cached_entity_type_dict is None:
            self._cached_entity_type_dict = {}
            for file in self.graph_KMap['files']:
                for extract_rule in file['extract_rules']:
                    self._cached_entity_type_dict[extract_rule['entity_type']] = file
        return self._cached_entity_type_dict

    @property
    def entity_types(self) -> list[str]:
        ''' entity_type列表 '''
        if self._cached_entity_types is None:
            self._cached_entity_types = list(self.entity_type_dict.keys())
        return self._cached_entity_types

    @property
    def entity_entity_types(self) -> list[str]:
        ''' 点的entity_type列表 '''
        if self._cached_entity_entity_types is None:
            self._cached_entity_entity_types = []
            for entity in self.graph_KMap['entity']:
                self._cached_entity_entity_types.append(entity['entity_type'])
        return self._cached_entity_entity_types

    @property
    def edge_entity_types(self) -> list[str]:
        ''' 边的entity_type列表 '''
        if self._cached_edge_entity_types is None:
            self._cached_edge_entity_types = []
            for edge in self.graph_KMap['edge']:
                self._cached_edge_entity_types.append(edge['entity_type'])
        return self._cached_edge_entity_types

    def entity_info(self, entity_name):
        '''
        获取实体类的信息
        Args:
            entity_name: 实体类名
        '''
        if self._cached_entity_info.get(entity_name) is None:
            self._cached_entity_info[entity_name] = KMapEntityInfo(entity_name, self)
        return self._cached_entity_info.get(entity_name)

    def edge_info(self, relation: list[str]):
        '''
        获取关系的信息
        Args:
            relation: 关系
        '''
        if self._cached_edge_info.get(str(relation)) is None:
            self._cached_edge_info[str(relation)] = KMapEdgeInfo(relation, self)
        return self._cached_edge_info.get(str(relation))

    @property
    def entity_otl(self) -> dict:
        ''' {实体类的 entity_type: 实体类名} '''
        if self._cached_entity_otl is None:
            self._cached_entity_otl = {
                entity['entity_type']: entity['name']
                for entity in self.graph_KMap['entity']
            }
        return self._cached_entity_otl


class KMapOtlInfo():
    ''' 根据本体的实体类名或者关系获取抽取信息 '''

    def __init__(self, kmap_config: GraphKMapConfig):
        self.kmap_config = kmap_config

        self.entity_type = None

    @property
    def otl_tab(self) -> dict:
        ''' {实体类属性: 抽取对象属性} '''
        pass

    @property
    def files(self) -> dict:
        ''' 对应的entity_type对应的抽取信息 '''
        return self.kmap_config.entity_type_dict.get(self.entity_type, {})

    @property
    def ds_id(self) -> int:
        ''' 抽取对象ds_id '''
        return self.files.get('ds_id')

    @property
    def data_source(self) -> str:
        ''' 抽取对象 data_source '''
        return self.files.get('data_source')

    @property
    def extract_type(self) -> str:
        ''' 抽取对象 extract_type '''
        return self.files.get('extract_type')


class KMapEntityInfo(KMapOtlInfo):
    ''' 根据实体类类获取实体类的抽取信息 '''

    def __init__(self, entity_name: str, kmap_config: GraphKMapConfig):
        super().__init__(kmap_config)

        self.property_map = None
        for entity in kmap_config.graph_KMap['entity']:
            if entity['name'] == entity_name:
                self.entity_type = entity['entity_type']
                self.property_map = entity['property_map']
                break

    @property
    def otl_tab(self) -> dict:
        ''' {实体类属性: 抽取对象属性} '''
        return {p['otl_prop']: p['entity_prop'] for p in self.property_map}


class KMapEdgeInfo(KMapOtlInfo):
    ''' 根据关系类获取关系类的抽取信息 '''

    def __init__(self, relation: list[str], kmap_config: GraphKMapConfig):
        super().__init__(kmap_config)
        self.relation = relation

        self.relation_map = None
        self.property_map = None
        for edge in kmap_config.graph_KMap['edge']:
            if edge['relations'] == relation:
                self.entity_type = edge['entity_type']
                self.relation_map = edge['relation_map']
                self.property_map = edge['property_map']
                break

    @property
    def begin_vertex_class(self) -> str:
        ''' 起点实体（本体层面）'''
        return self.relation[0]

    @property
    def end_vertex_class(self) -> str:
        ''' 终点实体（本体层面） '''
        return self.relation[2]

    @property
    def start_entity_class(self) -> str:
        ''' 起点实体的 entity_type '''
        return self.kmap_config.entity_info(self.begin_vertex_class).entity_type

    @property
    def end_entity_class(self) -> str:
        ''' 终点实体的 entity_type '''
        return self.kmap_config.entity_info(self.end_vertex_class).entity_type

    @property
    def begin_class_prop(self) -> str:
        ''' 起点实体的属性（本体层面） '''
        return self.relation_map['begin_class_prop']

    @property
    def start_prop(self) -> str:
        ''' 起点实体的属性（数据层面） '''
        return self.kmap_config.entity_info(self.begin_vertex_class).otl_tab[self.begin_class_prop]

    @property
    def end_class_prop(self) -> str:
        ''' 终点实体的属性（本体层面） '''
        return self.relation_map['end_class_prop']

    @property
    def end_prop(self) -> str:
        ''' 终点实体的属性（数据层面） '''
        return self.kmap_config.entity_info(self.end_vertex_class).otl_tab[self.end_class_prop]

    @property
    def relation_begin_pro(self) -> str:
        ''' 关系有映射文件时，关系文件与起点关联的属性名（数据层面） '''
        return self.relation_map['relation_begin_pro']

    @property
    def relation_end_pro(self) -> str:
        ''' 关系有映射文件时，关系文件与终点关联的属性名（数据层面） '''
        return self.relation_map['relation_end_pro']

    @property
    def equation(self) -> str:
        ''' 关系未映射文件时，起点实体的属性与终点实体的属性建立联系的方式，可能为：等于、包含、被包含 '''
        return self.relation_map['equation']

    @property
    def equation_begin(self) -> str:
        ''' 关系有映射文件时，起点实体的属性与关系文件的属性建立联系的方式，可能为：等于、包含、被包含 '''
        return self.relation_map['equation_begin']

    @property
    def equation_end(self) -> str:
        ''' 关系有映射文件时，关系文件的属性与终点实体的属性建立联系的方式，可能为：等于、包含、被包含 '''
        return self.relation_map['equation_end']

    @property
    def otl_tab(self) -> dict:
        ''' {实体类属性: 抽取对象属性} '''
        return {p['edge_prop']: p['entity_prop'] for p in self.property_map}
