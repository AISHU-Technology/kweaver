/* eslint-disable max-lines */
/**
 * @description 第一次进入处理数据
 */
const firstHandleData = (nodes, edges, mapEntity) => {
  // 处理点
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].nodeInfo && nodes[i].source_type !== 'manual') {
      for (let j = 0; j < mapEntity.length; j++) {
        if (nodes[i].name === mapEntity[j].entity_type) {
          nodes[i].nodeInfo = {
            entity_type: { value: mapEntity[j].entity_type, Type: 0 },
            attrSelect: mapEntity[j].entity_prop,
            keyProp: mapEntity[j].key_property,
            otl_name: mapEntity[j].entity_type,
            property_map: [],
            key_property: { value: '', Type: 0 }
          };

          if (mapEntity[j].key_property.includes('name')) {
            nodes[i].nodeInfo.key_property.value = 'name';
          }
        }
      }

      for (let q = 0; q < nodes[i].properties.length; q++) {
        if (nodes[i].nodeInfo && nodes[i].nodeInfo.attrSelect.includes(nodes[i].properties[q][0])) {
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: nodes[i].properties[q][0],
              entity_prop: {
                Type: 0,
                value: nodes[i].properties[q][0]
              }
            }
          ];
        } else if (nodes[i].nodeInfo) {
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: nodes[i].properties[q][0],
              entity_prop: {
                Type: 0,
                value: ''
              }
            }
          ];
        }
      }
    }
  }

  // 处理边
  for (let i = 0; i < edges.length; i++) {
    if (!edges[i].edgeInfo) {
      edges[i].edgeInfo = {
        entity_type: { value: '', Type: 0 },
        attrSelect: [],
        keyProp: [],
        otl_name: edges[i].name,
        property_map: [],
        key_property: { value: '', Type: 0 }
      };

      for (let q = 0; q < edges[i].properties.length; q++) {
        edges[i].edgeInfo.property_map = [
          ...edges[i].edgeInfo.property_map,
          {
            edge_prop: edges[i].properties[q][0],
            entity_prop: {
              Type: 0,
              value: ''
            }
          }
        ];
      }
    }

    // 自动预测的边带数据
    if (!edges[i].moreFile && edges[i].source_type !== 'manual') {
      for (let j = 0; j < mapEntity.length; j++) {
        if (edges[i].name === mapEntity[j].entity_type) {
          edges[i].edgeInfo = {
            entity_type: { value: mapEntity[j].entity_type, Type: 0 },
            attrSelect: mapEntity[j].entity_prop,
            keyProp: mapEntity[j].key_property,
            otl_name: mapEntity[j].entity_type,
            property_map: [],
            key_property: { value: 'name', Type: 0 }
          };
        }
      }

      for (let q = 0; q < edges[i].properties.length; q++) {
        if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect.includes(edges[i].properties[q][0])) {
          edges[i].edgeInfo.property_map = [
            ...edges[i].edgeInfo.property_map,
            {
              edge_prop: edges[i].properties[q][0],
              entity_prop: {
                Type: 0,
                value: edges[i].properties[q][0]
              }
            }
          ];
        }
      }
    }

    let anyshareNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].model === 'Anysharedocumentmodel') {
        anyshareNodes = [...anyshareNodes, nodes[i].name];
      }
    }

    // 如果是模型导入的节点，带入关系映射
    if (edges[i].model) {
      if (!edges[i].edgeInfo) {
        edges[i].edgeInfo = {
          entity_type: { value: edges[i].name, Type: 0 },
          attrSelect: [],
          keyProp: [],
          otl_name: edges[i].name,
          property_map: [{ edge_prop: 'name', entity_prop: { Type: 0, value: '' } }],
          key_property: { value: '', Type: 0 }
        };
      }

      edges[i].moreFile = [
        {
          Multi_relation: edges[i].model === 'Anysharedocumentmodel' ? '文档结构关系' : '外部关联',
          // Multi_relation: edges[i].model === 'Anysharedocumentmodel' ? '模式四' : '模式二',
          begin_prop: {
            value: edges[i].model === 'Anysharedocumentmodel' ? '' : findNode(nodes, edges[i]).start,
            Type: 0
          },
          edge_prop: [
            { value: '', Type: 0 },
            { value: '', Type: 0 }
          ],
          end_prop: {
            value: edges[i].model === 'Anysharedocumentmodel' ? '' : findNode(nodes, edges[i]).end,
            Type: 0
          }
        }
      ];

      if (edges[i].model !== 'Anysharedocumentmodel') {
        if (anyshareNodes.includes(edges[i].relations[0]) || anyshareNodes.includes(edges[i].relations[2])) {
          if (!edges[i].moreFile) {
            edges[i].moreFile = [
              {
                Multi_relation: '包含关系',
                // Multi_relation: '模式三',
                begin_prop: { value: '', Type: 0 },
                edge_prop: [],
                end_prop: { value: '', Type: 0 }
              }
            ];
          }
        }
      }

      if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect && edges[i].edgeInfo.attrSelect.includes('subject')) {
        edges[i].moreFile[0].edge_prop[0].value = 'subject';
      }

      if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect && edges[i].edgeInfo.attrSelect.includes('object')) {
        edges[i].moreFile[0].edge_prop[1].value = 'object';
      }
    } else if (anyshareNodes.includes(edges[i].relations[0]) || anyshareNodes.includes(edges[i].relations[2])) {
      if (!edges[i].moreFile) {
        edges[i].moreFile = [
          {
            Multi_relation: '包含关系',
            // Multi_relation: '模式三',
            begin_prop: { value: '', Type: 0 },
            edge_prop: [],
            end_prop: { value: '', Type: 0 }
          }
        ];
      }
    } else if (!edges[i].moreFile) {
      edges[i].moreFile = [
        {
          Multi_relation: '内部关联',
          // Multi_relation: '模式一',
          begin_prop: { value: '', Type: 0 },
          edge_prop: [],
          end_prop: { value: '', Type: 0 }
        }
      ];
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].nodeInfo) {
      nodes[i].nodeInfo = {
        entity_type: { value: '', Type: 0 },
        attrSelect: [],
        keyProp: [],
        otl_name: nodes[i].name,
        key_property: { value: '', Type: 0 },
        property_map: []
      };

      for (let j = 0; j < nodes[i].properties.length; j++) {
        nodes[i].nodeInfo.property_map = [
          ...nodes[i].nodeInfo.property_map,
          {
            otl_prop: nodes[i].properties[j][0],
            entity_prop: {
              Type: 0,
              value: ''
            }
          }
        ];
      }
    }
  }

  return { newNodes: nodes, newEdges: edges };
};

/**
 * @description 第一次进入处理数据
 */
const newFirstHandleData = (nodes, edges, mapEntity) => {
  // 处理点
  for (let i = 0; i < nodes.length; i++) {
    // 初始化数据，全部字段置为空
    nodes[i].nodeInfo = {
      otl_name: nodes[i].name, // 实体类名
      entity_type: { value: '', Type: 0 }, // 抽取对象字段
      property_map: [], // 属性映射模块
      attrSelect: [] // 抽取对象属性下拉框
    };

    // 抽取对象属性默认为空
    nodes[i].properties.forEach(item => {
      nodes[i].nodeInfo.property_map = [
        ...nodes[i].nodeInfo.property_map,
        {
          otl_prop: item[0],
          entity_prop: {
            Type: 0,
            value: ''
          }
        }
      ];
    });

    // 如果点为自动预测的点（包括数据源预测的和模型的）
    if (nodes[i].source_type !== 'manual') {
      mapEntity.forEach(item => {
        // 自动带入数据(抽取对象，抽取对象下拉框内容)
        if (nodes[i].name === item.entity_type) {
          nodes[i].nodeInfo = {
            entity_type: { value: item.entity_type, Type: 0 },
            attrSelect: item.entity_prop,
            otl_name: item.entity_type
          };
        }

        nodes[i].nodeInfo.property_map = [];
      });

      // 抽取对象属性映射
      nodes[i].properties.forEach(item => {
        // 如果抽取对象属性中有和实体属性相同的，则自动带入
        if (nodes[i].nodeInfo.attrSelect.includes(item[0])) {
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: item[0],
              entity_prop: {
                Type: 0,
                value: item[0]
              }
            }
          ];
        } else {
          // 如果实体属性没有和抽取对象属性相同的，则抽取对象属性为空
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: item[0],
              entity_prop: {
                Type: 0,
                value: ''
              }
            }
          ];
        }
      });
    }
  }

  // 处理边
  for (let i = 0; i < edges.length; i++) {
    // 全部字段置为空
    edges[i].edgeInfo = {
      otl_name: edges[i].name, // 关系类名
      entity_type: { value: '', Type: 0 }, // 抽取关系对象
      attrSelect: [], // 抽取关系对象属性下拉框内容
      property_map: [] // 属性映射模块
    };

    // 抽取关系对象属性默认为空
    edges[i].properties.forEach(item => {
      edges[i].edgeInfo.property_map = [
        ...edges[i].edgeInfo.property_map,
        {
          edge_prop: item[0],
          entity_prop: {
            Type: 0,
            value: ''
          }
        }
      ];
    });

    // 如果为自动预测的边
    if (edges[i].source_type !== 'manual') {
      // 自动带入数据(抽取关系对象，抽取关系对象下拉框内容)
      mapEntity.forEach(item => {
        if (edges[i].name === item.entity_type) {
          edges[i].edgeInfo = {
            entity_type: { value: item.entity_type, Type: 0 },
            attrSelect: item.entity_prop,
            otl_name: item.entity_type
          };
        }

        edges[i].edgeInfo.property_map = [];
      });

      edges[i].properties.forEach(item => {
        // 如果抽取关系对象属性中有和实体属性相同的，则自动带入
        if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect.includes(item[0])) {
          edges[i].edgeInfo.property_map = [
            ...edges[i].edgeInfo.property_map,
            {
              otl_prop: item[0],
              entity_prop: {
                Type: 0,
                value: item[0]
              }
            }
          ];
        } else {
          // 如果实体属性没有和抽取关系对象属性相同的，则抽取对象属性为空
          edges[i].edgeInfo.property_map = [
            ...edges[i].edgeInfo.property_map,
            {
              otl_prop: item[0],
              entity_prop: {
                Type: 0,
                value: ''
              }
            }
          ];
        }
      });
    }

    // 关系映射初始化
    edges[i].moreFile = {
      begin_class_prop: { Type: 0, value: '' }, // 起始点实体类属性值
      equation_begin: '', // 四个框时第一个等于
      relation_begin_pro: { Type: 0, value: '' }, // 抽取关系属性一
      equation: '', // 两个框时点等于
      relation_end_pro: { Type: 0, value: '' }, // 抽取关系属性二
      equation_end: '', // 四个框时第二个等于
      end_class_prop: { Type: 0, value: '' } // 终点实体类属性值
    };
  }

  return { newNodes: nodes, newEdges: edges };
};

/**
 * @description 处理校验之后的数据
 */
const handleCheckData = ({ nodes, edges, mapEntity, otls_map, relations_map }) => {
  // 处理点
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 0; j < otls_map.length; j++) {
      if (nodes[i].name === otls_map[j].otl_name.value) {
        nodes[i].Type = otls_map[j].otl_name.Type;

        nodes[i].nodeInfo = {
          otl_name: otls_map[j].otl_name.value,
          key_property: otls_map[j].key_property,
          property_map: [],
          entity_type: otls_map[j].entity_type
        };

        for (let q = 0; q < mapEntity.length; q++) {
          if (otls_map[j].entity_type.value === mapEntity[q].entity_type) {
            nodes[i].nodeInfo.attrSelect = mapEntity[q].entity_prop;
            nodes[i].nodeInfo.keyProp = mapEntity[q].key_property;
          }
        }

        // 重新组合属性映射
        let nodePropertity = [];

        for (let q = 0; q < nodes[i].properties.length; q++) {
          nodePropertity = [...nodePropertity, nodes[i].properties[q][0]];
        }

        for (let e = 0; e < nodes[i].properties.length; e++) {
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: nodes[i].properties[e][0],
              entity_prop: { value: '', Type: 0 }
            }
          ];
        }

        for (let q = 0; q < otls_map[j].property_map.length; q++) {
          const index = nodePropertity.indexOf(otls_map[j].property_map[q].otl_prop.value);

          if (index !== -1 && !otls_map[j].property_map[q].otl_prop.Type) {
            nodes[i].nodeInfo.property_map[index].entity_prop = otls_map[j].property_map[q].entity_prop;
          }
        }
      }
    }
  }

  // 处理边
  for (let i = 0; i < edges.length; i++) {
    for (let j = 0; j < relations_map.length; j++) {
      if (edges[i].name === relations_map[j].relation_info.edge_name.value) {
        edges[i].Type = relations_map[j].relation_info.edge_name.Type;

        edges[i].moreFile = [];
        if (relations_map[j].relation_map.length > 0) {
          for (let q = 0; q < relations_map[j].relation_map.length; q++) {
            edges[i].moreFile = [
              ...edges[i].moreFile,
              {
                Multi_relation: relations_map[j].relation_map[q].Multi_relation.value,
                begin_prop: relations_map[j].relation_map[q].begin_prop,
                end_prop: relations_map[j].relation_map[q].end_prop,
                edge_prop: relations_map[j].relation_map[q].edge_prop
              }
            ];
          }
        } else if (!edges[i].moreFile) {
          edges[i].moreFile = [
            {
              // Multi_relation: '内部关联',
              Multi_relation: '模式一',
              begin_prop: { value: '', Type: 0 },
              edge_prop: [],
              end_prop: { value: '', Type: 0 }
            }
          ];
        }

        edges[i].edgeInfo = {
          otl_name: edges[i].name,
          key_property: relations_map[j].relation_info.key_property,
          property_map: [],
          entity_type: relations_map[j].relation_info.entity_type
        };

        for (let q = 0; q < mapEntity.length; q++) {
          if (relations_map[j].relation_info.entity_type.value === mapEntity[q].entity_type) {
            edges[i].edgeInfo.attrSelect = mapEntity[q].entity_prop;
            edges[i].edgeInfo.keyProp = mapEntity[q].key_property;
          }
        }

        // 重新组合属性映射
        let nodePropertity = [];

        for (let q = 0; q < edges[i].properties.length; q++) {
          nodePropertity = [...nodePropertity, edges[i].properties[q][0]];
        }

        for (let e = 0; e < edges[i].properties.length; e++) {
          edges[i].edgeInfo.property_map = [
            ...edges[i].edgeInfo.property_map,
            {
              edge_prop: edges[i].properties[e][0],
              entity_prop: { value: '', Type: 0 }
            }
          ];
        }

        for (let q = 0; q < relations_map[j].property_map.length; q++) {
          const index = nodePropertity.indexOf(relations_map[j].property_map[q].edge_prop.value);

          if (index !== -1 && !relations_map[j].property_map[q].edge_prop.Type) {
            edges[i].edgeInfo.property_map[index].entity_prop = relations_map[j].property_map[q].entity_prop;
          }
        }
      }
    }
  }
};

/**
 * 处理检查的后的数据
 */
const newHanleCheckData = ({ nodes, edges, mapEntity, otls_map, relations_map, saveRelationMap }) => {
  // 处理点
  for (let i = 0; i < nodes.length; i++) {
    // 将点与校验数据进行对比，设置初始值
    otls_map.forEach(item => {
      // 处理已配置过的点,已配置过的点将数据带入
      if (nodes[i].name === item.otl_name.value) {
        nodes[i].Type = item.otl_name.Type;

        nodes[i].nodeInfo = {
          otl_name: item.otl_name.value,
          property_map: [],
          entity_type: item.entity_type,
          attrSelect: []
        };

        mapEntity.forEach(eItem => {
          if (item.entity_type.value === eItem.entity_type) {
            nodes[i].nodeInfo.attrSelect = eItem.entity_prop;
          }
        });

        // 带入抽取对象属性
        nodes[i].properties.forEach(pItem => {
          const property_map = {
            otl_prop: pItem[0],
            entity_prop: { value: '', Type: 0 }
          };

          item.property_map.forEach(oItem => {
            if (pItem[0] === oItem.otl_prop.value) {
              property_map.entity_prop = oItem.entity_prop;
            }
          });

          nodes[i].nodeInfo.property_map = [...nodes[i].nodeInfo.property_map, property_map];
        });
      }
    });
    // 新增加的点，需要自动带入映射数据
    if (!nodes[i].nodeInfo) {
      newNodeMap(nodes[i], mapEntity);
    }
  }

  //  处理边
  for (let i = 0; i < edges.length; i++) {
    relations_map.forEach((item, index) => {
      // 处理已配置过的边
      const _temp = [
        item?.relation_info?.begin_name,
        item?.relation_info?.edge_name?.value,
        item?.relation_info?.end_name
      ];

      if (edges[i]?.relations?.join(',') === _temp.join(',')) {
        edges[i].Type = item.relation_info.edge_name.Type;

        edges[i].edgeInfo = {
          otl_name: edges[i].name,
          property_map: [],
          entity_type: item.relation_info.entity_type,
          attrSelect: []
        };

        mapEntity.forEach(eItem => {
          if (item.relation_info.entity_type.value === eItem.entity_type) {
            edges[i].edgeInfo.attrSelect = eItem.entity_prop;
          }
        });

        edges[i].properties.forEach(pItem => {
          const property_map = {
            edge_prop: pItem[0],
            entity_prop: { value: '', Type: 0 }
          };

          item.property_map.forEach(oItem => {
            // 边的属性也是otl_prop
            if (pItem[0] === oItem?.otl_prop?.value) {
              property_map.entity_prop = oItem.entity_prop;
            }
          });

          edges[i].edgeInfo.property_map = [...edges[i].edgeInfo.property_map, property_map];
        });

        // 关系映射带值
        edges[i].moreFile = {
          begin_class_prop: {
            value: item.relation_map[0].begin_class_prop.Value,
            Type: item.relation_map[0].begin_class_prop.Type
          },
          equation_begin: saveRelationMap[index].relation_map[0].equation_begin,
          relation_begin_pro: {
            value: item.relation_map[0].relation_begin_pro.Value,
            Type: item.relation_map[0].relation_begin_pro.Type
          },
          equation: saveRelationMap[index].relation_map[0].equation,
          relation_end_pro: {
            value: item.relation_map[0].relation_end_pro.Value,
            Type: item.relation_map[0].relation_end_pro.Type
          },
          equation_end: saveRelationMap[index].relation_map[0].equation_end,
          end_class_prop: {
            value: item.relation_map[0].end_class_prop.Value,
            Type: item.relation_map[0].end_class_prop.Type
          }
        };
      }
    });

    if (!edges[i].edgeInfo) {
      newEdgeMap(edges[i], mapEntity);
    }
  }
};

/**
 * @description 第三步新增的节点进入第五步时进行映射
 */
const newNodeMap = (node, mapEntity) => {
  // 初始化数据，全部字段置为空
  node.nodeInfo = {
    otl_name: node.name, // 实体类名
    entity_type: { value: '', Type: 0 }, // 抽取对象字段
    property_map: [], // 属性映射模块
    attrSelect: [] // 抽取对象属性下拉框
  };

  // 抽取对象属性默认为空
  node.properties.forEach(item => {
    node.nodeInfo.property_map = [
      ...node.nodeInfo.property_map,
      {
        otl_prop: item[0],
        entity_prop: {
          Type: 0,
          value: ''
        }
      }
    ];
  });

  if (node.source_type !== 'manual') {
    mapEntity.forEach(item => {
      if (node.name === item.entity_type) {
        node.nodeInfo = {
          entity_type: { value: item.entity_type, Type: 0 },
          attrSelect: item.entity_prop,
          otl_name: item.entity_type,
          property_map: []
        };
      }
    });

    node.properties.forEach(item => {
      // 如果抽取对象属性中有和实体属性相同的，则自动带入
      if (node.nodeInfo.attrSelect.includes(item[0])) {
        node.nodeInfo.property_map = [
          ...node.nodeInfo.property_map,
          {
            otl_prop: item[0],
            entity_prop: {
              Type: 0,
              value: item[0]
            }
          }
        ];
      } else {
        // 如果实体属性没有和抽取对象属性相同的，则抽取对象属性为空
        node.nodeInfo.property_map = [
          ...node.nodeInfo.property_map,
          {
            otl_prop: item[0],
            entity_prop: {
              Type: 0,
              value: ''
            }
          }
        ];
      }
    });
  }
};

/**
 * @description 第三步新增的边进入第五步时进行映射
 */
const newEdgeMap = (edge, mapEntity) => {
  edge.edgeInfo = {
    otl_name: edge.name,
    property_map: [],
    entity_type: { value: '', Type: 0 },
    attrSelect: []
  };

  // 关系映射初始化
  edge.moreFile = {
    begin_class_prop: { Type: 0, value: '' }, // 起始点实体类属性值
    equation_begin: '', // 四个框时第一个等于
    relation_begin_pro: { Type: 0, value: '' }, // 抽取关系属性一
    equation: '', // 两个框时点等于
    relation_end_pro: { Type: 0, value: '' }, // 抽取关系属性二
    equation_end: '', // 四个框时第二个等于
    end_class_prop: { Type: 0, value: '' } // 终点实体类属性值
  };

  // 抽取对象属性默认为空
  edge.properties.forEach(item => {
    edge.edgeInfo.property_map = [
      ...edge.edgeInfo.property_map,
      {
        edge_prop: item[0],
        entity_prop: {
          Type: 0,
          value: ''
        }
      }
    ];
  });

  if (edge.source_type !== 'manual') {
    mapEntity.forEach(item => {
      if (edge.name === item.entity_type) {
        edge.edgeInfo = {
          otl_name: item.entity_type,
          property_map: [],
          entity_type: { value: item.entity_type, Type: 0 },
          attrSelect: item.entity_prop
        };
      }
    });

    edge.properties.forEach(item => {
      // 如果抽取对象属性中有和实体属性相同的，则自动带入
      if (edge.edgeInfo.attrSelect.includes(item[0])) {
        edge.edgeInfo.property_map = [
          ...edge.edgeInfo.property_map,
          {
            edge_prop: item[0],
            entity_prop: {
              Type: 0,
              value: item[0]
            }
          }
        ];
      } else {
        edge.edgeInfo.property_map = [
          ...edge.edgeInfo.property_map,
          {
            edge_prop: item[0],
            entity_prop: {
              Type: 0,
              value: ''
            }
          }
        ];
      }
    });
  }
};

/**
 * @description 处理完校验之后再初始化数据
 */
const initCheckedData = (nodes, edges, mapEntity) => {
  // 带点
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].nodeInfo && nodes[i].source_type !== 'manual') {
      for (let j = 0; j < mapEntity.length; j++) {
        if (nodes[i].name === mapEntity[j].entity_type) {
          nodes[i].nodeInfo = {
            entity_type: { value: mapEntity[j].entity_type, Type: 0 },
            attrSelect: mapEntity[j].entity_prop,
            keyProp: mapEntity[j].key_property,
            otl_name: mapEntity[j].entity_type,
            property_map: [],
            key_property: { value: 'name', Type: 0 }
          };
        }
      }

      for (let q = 0; q < nodes[i].properties.length; q++) {
        if (nodes[i].nodeInfo && nodes[i].nodeInfo.attrSelect.includes(nodes[i].properties[q][0])) {
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: nodes[i].properties[q][0],
              entity_prop: {
                Type: 0,
                value: nodes[i].properties[q][0]
              }
            }
          ];
        } else if (nodes[i].nodeInfo) {
          nodes[i].nodeInfo.property_map = [
            ...nodes[i].nodeInfo.property_map,
            {
              otl_prop: nodes[i].properties[q][0],
              entity_prop: {
                Type: 0,
                value: ''
              }
            }
          ];
        }
      }
    }
  }

  // 带边
  for (let i = 0; i < edges.length; i++) {
    if (!edges[i].edgeInfo) {
      edges[i].edgeInfo = {
        entity_type: { value: '', Type: 0 },
        attrSelect: [],
        keyProp: [],
        otl_name: edges[i].name,
        property_map: [],
        key_property: { value: '', Type: 0 }
      };

      for (let q = 0; q < edges[i].properties.length; q++) {
        edges[i].edgeInfo.property_map = [
          ...edges[i].edgeInfo.property_map,
          {
            edge_prop: edges[i].properties[q][0],
            entity_prop: {
              Type: 0,
              value: ''
            }
          }
        ];
      }
    }

    if (!edges[i].moreFile && edges[i].source_type !== 'manual') {
      for (let j = 0; j < mapEntity.length; j++) {
        if (edges[i].name === mapEntity[j].entity_type) {
          edges[i].edgeInfo = {
            entity_type: { value: mapEntity[j].entity_type, Type: 0 },
            attrSelect: mapEntity[j].entity_prop,
            keyProp: mapEntity[j].key_property,
            otl_name: mapEntity[j].entity_type,
            property_map: [],
            key_property: { value: 'name', Type: 0 }
          };
        }
      }

      for (let q = 0; q < edges[i].properties.length; q++) {
        if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect.includes(edges[i].properties[q][0])) {
          edges[i].edgeInfo.property_map = [
            ...edges[i].edgeInfo.property_map,
            {
              edge_prop: edges[i].properties[q][0],
              entity_prop: {
                Type: 0,
                value: edges[i].properties[q][0]
              }
            }
          ];
        }
      }
    }

    let anyshareNodes = [];

    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].model === 'Anysharedocumentmodel') {
        anyshareNodes = [...anyshareNodes, nodes[i].name];
      }
    }

    // 如果是模型导入的节点，带入关系映射
    if (edges[i].model) {
      if (!edges[i].edgeInfo) {
        edges[i].edgeInfo = {
          entity_type: { value: edges[i].name, Type: 0 },
          attrSelect: [],
          keyProp: [],
          otl_name: edges[i].name,
          property_map: [{ edge_prop: 'name', entity_prop: { Type: 0, value: '' } }],
          key_property: { value: '', Type: 0 }
        };
      }

      if (!edges[i].moreFile) {
        edges[i].moreFile = [
          {
            Multi_relation: edges[i].model === 'Anysharedocumentmodel' ? '文档结构关系' : '外部关联',
            // Multi_relation: edges[i].model === 'Anysharedocumentmodel' ? '模式四' : '模式二',
            begin_prop: {
              value: edges[i].model === 'Anysharedocumentmodel' ? '' : findNode(nodes, edges[i]).start,
              Type: 0
            },
            edge_prop: [
              { value: '', Type: 0 },
              { value: '', Type: 0 }
            ],
            end_prop: {
              value: edges[i].model === 'Anysharedocumentmodel' ? '' : findNode(nodes, edges[i]).end,
              Type: 0
            }
          }
        ];

        if (edges[i].model !== 'Anysharedocumentmodel') {
          if (anyshareNodes.includes(edges[i].relations[0]) || anyshareNodes.includes(edges[i].relations[2])) {
            if (!edges[i].moreFile) {
              edges[i].moreFile = [
                {
                  Multi_relation: '包含关系',
                  // Multi_relation: '模式三',
                  begin_prop: { value: '', Type: 0 },
                  edge_prop: [],
                  end_prop: { value: '', Type: 0 }
                }
              ];
            }
          }
        }

        if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect && edges[i].edgeInfo.attrSelect.includes('subject')) {
          edges[i].moreFile[0].edge_prop[0].value = 'subject';
        }

        if (edges[i].edgeInfo && edges[i].edgeInfo.attrSelect && edges[i].edgeInfo.attrSelect.includes('object')) {
          edges[i].moreFile[0].edge_prop[1].value = 'object';
        }
      }
    } else if (anyshareNodes.includes(edges[i].relations[0]) || anyshareNodes.includes(edges[i].relations[2])) {
      if (!edges[i].moreFile) {
        edges[i].moreFile = [
          {
            Multi_relation: '包含关系',
            // Multi_relation: '模式三',
            begin_prop: { value: '', Type: 0 },
            edge_prop: [],
            end_prop: { value: '', Type: 0 }
          }
        ];
      }
    } else if (!edges[i].moreFile) {
      edges[i].moreFile = [
        {
          Multi_relation: '内部关联',
          // Multi_relation: '模式一',
          begin_prop: { value: '', Type: 0 },
          edge_prop: [],
          end_prop: { value: '', Type: 0 }
        }
      ];
    }
  }

  // 点类初始化
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].nodeInfo) {
      nodes[i].nodeInfo = {
        entity_type: { value: '', Type: 0 },
        attrSelect: [],
        keyProp: [],
        otl_name: nodes[i].name,
        key_property: { value: '', Type: 0 },
        property_map: []
      };

      for (let j = 0; j < nodes[i].properties.length; j++) {
        nodes[i].nodeInfo.property_map = [
          ...nodes[i].nodeInfo.property_map,
          {
            otl_prop: nodes[i].properties[j][0],
            entity_prop: {
              Type: 0,
              value: ''
            }
          }
        ];
      }
    }
  }
};

/**
 * @description 第三步修改属性更新,如果属性不存在了，就在校验参数里去掉
 */
const updateProperty = (ontoData, data) => {
  const tempNode = ontoData[0].entity;
  const tempEdge = ontoData[0].edge;

  let node = [];
  let edge = [];

  for (let i = 0; i < tempNode.length; i++) {
    const temp = {
      name: tempNode[i].name,
      property: []
    };

    for (let j = 0; j < tempNode[i].properties.length; j++) {
      temp.property = [...temp.property, tempNode[i].properties[j][0]];
    }

    node = [...node, temp];
  }

  for (let i = 0; i < tempEdge.length; i++) {
    const temp = {
      name: tempEdge[i].name,
      property: [],
      relations: tempEdge[i].relations
    };

    for (let j = 0; j < tempEdge[i].properties.length; j++) {
      temp.property = [...temp.property, tempEdge[i].properties[j][0]];
    }

    edge = [...edge, temp];
  }

  const { otls_map, relations_map } = data.graph_KMap[0];

  for (let i = 0; i < otls_map.length; i++) {
    for (let j = 0; j < node.length; j++) {
      if (otls_map[i].otl_name === node[j].name) {
        otls_map[i].property_map = otls_map[i].property_map.filter((item, index) => {
          return node[j].property.includes(item.otl_prop);
        });
      }
    }
  }

  for (let i = 0; i < relations_map.length; i++) {
    if (relations_map[i].relation_info) {
      for (let j = 0; j < edge.length; j++) {
        const _temp = [
          relations_map[i]?.relation_info?.begin_name,
          relations_map[i]?.relation_info?.edge_name,
          relations_map[i]?.relation_info?.end_name
        ];

        if (_temp.join(',') === edge[j]?.relations?.join(',')) {
          relations_map[i].property_map = relations_map[i].property_map.filter((item, index) => {
            return edge[j].property.includes(item.edge_prop);
          });

          relations_map[i].relation_info.begin_name = edge[j].relations[0];
          relations_map[i].relation_info.end_name = edge[j].relations[2];
        }
      }
    } else {
      relations_map[i].relation_info = {};
    }
  }

  return { otls_map, relations_map };
};

/**
 * @description 处理数据给下一步
 */
const handleDataToNext = (nodes, edges) => {
  let otls_map = [];
  let relations_map = [];

  // 处理点数据
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeInfo) {
      const temp = {
        otl_name: nodes[i].nodeInfo.otl_name,
        entity_type: nodes[i].nodeInfo.entity_type.value,
        key_property: nodes[i].nodeInfo.key_property.value,
        property_map: []
      };

      for (let j = 0; j < nodes[i].nodeInfo.property_map.length; j++) {
        temp.property_map = [
          ...temp.property_map,
          {
            otl_prop: nodes[i].nodeInfo.property_map[j].otl_prop,
            entity_prop: nodes[i].nodeInfo.property_map[j].entity_prop.value
          }
        ];
      }

      otls_map = [...otls_map, temp];
    }
  }

  // 处理边数据
  for (let i = 0; i < edges.length; i++) {
    let data = '';

    if (edges[i].edgeInfo) {
      data = {
        relation_info: {
          begin_name: edges[i].relations[0],
          edge_name: edges[i].relations[1],
          end_name: edges[i].relations[2],
          entity_type: edges[i].edgeInfo.entity_type.value,
          key_property: edges[i].edgeInfo.key_property.value
        }
      };

      data.property_map = [];

      for (let j = 0; j < edges[i].edgeInfo.property_map.length; j++) {
        data.property_map = [
          ...data.property_map,
          {
            edge_prop: edges[i].edgeInfo.property_map[j].edge_prop,
            entity_prop: edges[i].edgeInfo.property_map[j].entity_prop.value
          }
        ];
      }
    }

    if (edges[i].moreFile) {
      if (!data) {
        data = {
          relation_map: []
        };
      } else {
        data.relation_map = [];
      }

      for (let j = 0; j < edges[i].moreFile.length; j++) {
        const temp = {
          Multi_relation: edges[i].moreFile[j].Multi_relation,
          begin_prop: edges[i].moreFile[j].begin_prop.value,
          end_prop: edges[i].moreFile[j].end_prop.value,
          edge_prop: []
        };

        if (edges[i].moreFile[j].edge_prop.length === 0) {
          temp.edge_prop = [];
        }

        if (edges[i].moreFile[j].edge_prop.length === 1) {
          temp.edge_prop = [edges[i].moreFile[j].edge_prop[0].value];
        }

        if (edges[i].moreFile[j].edge_prop.length === 2) {
          temp.edge_prop = [edges[i].moreFile[j].edge_prop[0].value, edges[i].moreFile[j].edge_prop[1].value];
        }

        data.relation_map = [...data.relation_map, temp];
      }
    }

    if (data) {
      relations_map = [...relations_map, data];
    }
  }

  return { otls_map, relations_map };
};

/**
 * @description 新写的处理数据给下一步
 */
const newHandleDataToNext = (nodes, edges) => {
  let otls_map = [];
  let relations_map = [];

  // 处理点数据
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeInfo) {
      const temp = {
        otl_name: nodes[i].nodeInfo.otl_name,
        entity_type: nodes[i].nodeInfo.entity_type.value,
        property_map: []
      };

      for (let j = 0; j < nodes[i].nodeInfo.property_map.length; j++) {
        temp.property_map = [
          ...temp.property_map,
          {
            otl_prop: nodes[i].nodeInfo.property_map[j].otl_prop,
            entity_prop: nodes[i].nodeInfo.property_map[j].entity_prop.value
          }
        ];
      }

      const copy = temp.property_map.filter((element, index, self) => {
        return self.findIndex(x => x.otl_prop === element.otl_prop) === index;
      });

      temp.property_map = copy;

      otls_map = [...otls_map, temp];
    }
  }

  // 处理边数据
  for (let i = 0; i < edges.length; i++) {
    let data = '';

    if (edges[i].edgeInfo) {
      data = {
        relation_info: {
          source_type: edges[i].source_type, // 点类型，手动/自动
          model: edges[i].model,
          begin_name: edges[i].relations[0],
          edge_name: edges[i].relations[1],
          end_name: edges[i].relations[2],
          entity_type: edges[i].edgeInfo.entity_type.value
        }
      };

      data.property_map = [];

      for (let j = 0; j < edges[i].edgeInfo.property_map.length; j++) {
        data.property_map = [
          ...data.property_map,
          {
            // 模型对应字段为otl_prop
            edge_prop: edges[i].edgeInfo.property_map[j].otl_prop || edges[i].edgeInfo.property_map[j].edge_prop,
            entity_prop: edges[i].edgeInfo.property_map[j].entity_prop.value
          }
        ];
      }
      const copy = data.property_map.filter((element, index, self) => {
        return self.findIndex(x => x.edge_prop === element.edge_prop) === index;
      });

      data.property_map = copy;
    }

    if (edges[i].moreFile) {
      if (!data) {
        data = {
          relation_map: []
        };
      } else {
        data.relation_map = [];
      }
      let defaultBegin = edges[i].moreFile.begin_class_prop && edges[i].moreFile.begin_class_prop.value ? '等于' : '';
      let defaultEnd = edges[i].moreFile.end_class_prop && edges[i].moreFile.end_class_prop.value ? '等于' : '';

      if (edges[i].moreFile.equation) {
        defaultBegin = '';
        defaultEnd = '';
      }

      const temp = {
        begin_class_prop: edges[i].moreFile.begin_class_prop.value || '',
        equation_begin: edges[i].moreFile.equation_begin || defaultBegin,
        relation_begin_pro: edges[i].moreFile.relation_begin_pro.value || '',
        equation: edges[i].moreFile.equation || '',
        relation_end_pro: edges[i].moreFile.relation_end_pro.value || '',
        equation_end: edges[i].moreFile.equation_end || defaultEnd,
        end_class_prop: edges[i].moreFile.end_class_prop.value || ''
      };

      data.relation_map = [...data.relation_map, temp];
    }

    if (data) {
      relations_map = [...relations_map, data];
    }
  }

  return { otls_map, relations_map };
};

/**
 * @description 根据边找节点
 */
const findNode = (nodes, edge) => {
  let start = '';
  let end = '';

  for (let i = 0; i < nodes.length; i++) {
    if (
      edge.relations[0] === nodes[i].name &&
      nodes[i].nodeInfo &&
      nodes[i].nodeInfo.attrSelect &&
      nodes[i].nodeInfo.attrSelect.includes('name')
    ) {
      start = 'name';
    }

    if (
      edge.relations[2] === nodes[i].name &&
      nodes[i].nodeInfo &&
      nodes[i].nodeInfo.attrSelect &&
      nodes[i].nodeInfo.attrSelect.includes('name')
    ) {
      end = 'name';
    }
  }

  return { start, end };
};

export {
  firstHandleData,
  updateProperty,
  handleDataToNext,
  handleCheckData,
  initCheckedData,
  newFirstHandleData,
  newHanleCheckData,
  newHandleDataToNext
};
