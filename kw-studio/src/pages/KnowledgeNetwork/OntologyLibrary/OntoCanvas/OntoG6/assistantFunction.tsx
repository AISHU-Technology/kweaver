/* eslint-disable max-lines */
import _ from 'lodash';
import { GraphData } from './types/data';
import intl from 'react-intl-universal';

export enum ONTO_CATEGORY {
  CATEGORY_MAIN = 'main', // 类名
  CATEGORY_DETAIL = 'detail', // 详情
  CATEGORY_ATTRIBUTES = 'attributes' // 属性
}

export type TestNameDataType = { value: string; valueName: string; maxLen: number; TEST: RegExp; TEST_ERR: string };
export type RepeatOption = { valueArr: string[]; index: number };
export type ErrorType = { name: string; value: any; error: string; category: ONTO_CATEGORY };

const eLettersNumber_ = /^[0-9a-zA-Z_]{1,}$/;
const ceLettersNumber_ = /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/;
const ceLettersNumberSymbols = /^[!-~a-zA-Z0-9_\u4e00-\u9fa5 ！￥……（）——“”：；，。？、‘’《》｛｝【】·\s]+$/;
// 错误信息汇总
let nodesError: ErrorType[] = [];
let edgesError: ErrorType[] = [];

// 通过数据来校检所有错误
export const validateItem = (graphData: GraphData) => {
  nodesError = [];
  edgesError = [];
  _.map(graphData.nodes, node => {
    validateNodeClassName(graphData, node);
    validateNodeClassShowName(graphData, node);
    validateNodeRequiredData(node);
    ValidateNodeOptionalData(node);
  });
  _.map(graphData.edges, edge => {
    validateEdgeClassName(graphData, edge);
    validateEdgeClassShowName(graphData, edge);
    ValidateEdgeOptionalData(edge);
  });
  return { nodesError, edgesError };
};

export const validateTheNode = (graphData: GraphData, node: Record<string, any>) => {
  nodesError = [];
  validateNodeClassName(graphData, node);
  validateNodeClassShowName(graphData, node);
  validateNodeRequiredData(node);
  ValidateNodeOptionalData(node);
  return nodesError;
};

export const validateTheEdge = (graphData: GraphData, edge: Record<string, any>) => {
  edgesError = [];
  validateEdgeClassName(graphData, edge);
  validateEdgeClassShowName(graphData, edge);
  ValidateEdgeOptionalData(edge);
  return edgesError;
};

const validateNodeClassName = (graphData: GraphData, node: Record<string, any>) => {
  // 基础校验
  ValidateNodeName(
    {
      value: node.name,
      valueName: intl.get('ontoLib.canvasOnto.entityClassName'),
      maxLen: 255,
      TEST: eLettersNumber_,
      TEST_ERR: 'eLettersNumber_'
    },
    true,
    ONTO_CATEGORY.CATEGORY_MAIN
  );
  // 实体类名不能和其余实体类名相同
  _.map(graphData.nodes, graphNode => {
    if (graphNode.uid !== node.uid && graphNode.name === node.name) {
      nodesError = [
        ...nodesError,
        {
          name: intl.get('ontoLib.canvasOnto.entityClassName'),
          value: node.name,
          error: intl.get('global.repeatName'),
          category: ONTO_CATEGORY.CATEGORY_MAIN
        }
      ];
    }
  });
  // 实体类名不能和其余关系类名相同
  _.map(graphData.edges, graphEdge => {
    if (graphEdge.name === node.name) {
      nodesError = [
        ...nodesError,
        {
          name: intl.get('ontoLib.canvasOnto.entityClassName'),
          value: node.name,
          error: intl.get('global.repeatName'),
          category: ONTO_CATEGORY.CATEGORY_MAIN
        }
      ];
    }
  });
};

const validateEdgeClassName = (graphData: GraphData, edge: Record<string, any>) => {
  // 基础校验
  ValidateEdgeName(
    {
      value: edge.name,
      valueName: intl.get('ontoLib.canvasEdge.edgeClassName'),
      maxLen: 255,
      TEST: eLettersNumber_,
      TEST_ERR: 'eLettersNumber_'
    },
    true,
    ONTO_CATEGORY.CATEGORY_MAIN
  );
  // 关系类名不能和其他实体类名一样
  _.map(graphData.nodes, node => {
    if (node.name === edge.name) {
      edgesError = [
        ...edgesError,
        {
          name: intl.get('ontoLib.canvasEdge.edgeClassName'),
          value: edge.name,
          error: intl.get('global.repeatName'),
          category: ONTO_CATEGORY.CATEGORY_MAIN
        }
      ];
    }
  });
  // （起点和终点一样的情况下）不能和其他关系类名一样
  const filterEdges = graphData.edges.filter(item => item.uid !== edge.uid);
  const filterEdgeName = filterEdges.filter(
    item => item.startId === edge.startId && item.endId === edge.endId && item.name === edge.name
  );
  if (filterEdgeName.length > 0) {
    edgesError = [
      ...edgesError,
      {
        name: intl.get('ontoLib.canvasEdge.edgeClassName'),
        value: edge.name,
        error: intl.get('global.repeatName'),
        category: ONTO_CATEGORY.CATEGORY_MAIN
      }
    ];
  }
  // 不能和模型的关系类名一样
  const filterModelEdgeName = filterEdges.filter(
    item => item.model !== '' && item.model !== undefined && item.name === edge.name
  );
  if (filterModelEdgeName.length > 0) {
    edgesError = [
      ...edgesError,
      {
        name: intl.get('ontoLib.canvasEdge.edgeClassName'),
        value: edge.name,
        error: intl.get('ontoLib.errInfo.repeatErr'),
        category: ONTO_CATEGORY.CATEGORY_MAIN
      }
    ];
  }
};

const validateNodeClassShowName = (graphData: GraphData, node: Record<string, any>) => {
  // 基础校验
  ValidateNodeName(
    {
      value: node.alias,
      valueName: intl.get('ontoLib.canvasOnto.entityShowName'),
      maxLen: 255,
      TEST: ceLettersNumber_,
      TEST_ERR: 'ceLettersNumber_'
    },
    true,
    ONTO_CATEGORY.CATEGORY_DETAIL
  );
  // 实体类显示名不能和其余实体类显示名相同
  _.map(graphData.nodes, graphNode => {
    if (graphNode.uid !== node.uid && graphNode.alias === node.alias) {
      nodesError = [
        ...nodesError,
        {
          name: intl.get('ontoLib.canvasOnto.entityShowName'),
          value: node.alias,
          error: intl.get('global.repeatName'),
          category: ONTO_CATEGORY.CATEGORY_DETAIL
        }
      ];
    }
  });
};

const validateEdgeClassShowName = (graphData: GraphData, edge: Record<string, any>) => {
  // 基础校验
  ValidateEdgeName(
    {
      value: edge.alias,
      valueName: intl.get('ontoLib.canvasEdge.edgeDisplayFName'),
      maxLen: 255,
      TEST: ceLettersNumber_,
      TEST_ERR: 'ceLettersNumber_'
    },
    true,
    ONTO_CATEGORY.CATEGORY_DETAIL
  );
  // （起点和终点一样的情况下）不能和其他关系类显示名一样
  const filterEdges = graphData.edges.filter(item => item.uid !== edge.uid);
  const filterEdgeAlias = filterEdges.filter(
    item => item.startId === edge.startId && item.endId === edge.endId && item.alias === edge.alias
  );
  if (filterEdgeAlias.length > 0) {
    edgesError = [
      ...edgesError,
      {
        name: intl.get('ontoLib.canvasEdge.edgeDisplayFName'),
        value: edge.alias,
        error: intl.get('global.repeatName'),
        category: ONTO_CATEGORY.CATEGORY_DETAIL
      }
    ];
  }
  // // 关系类名不一样的情况下，不能和其余关系类名一样
  // const filterOtherEdgeAlias = filterEdges.filter(item => item.name !== edge.name && item.alias === edge.alias);
  // if (filterOtherEdgeAlias.length > 0) {
  //   edgesError = [
  //     ...edgesError,
  //     {
  //       name: intl.get('ontoLib.canvasEdge.edgeDisplayFName'),
  //       value: edge.alias,
  //       error: intl.get('ontoLib.errInfo.alreadyExisted', {
  //         name: intl.get('ontoLib.canvasEdge.edgeDisplayFName')
  //       }),
  //       category: ONTO_CATEGORY.CATEGORY_DETAIL
  //     }
  //   ];
  // }
};

const validateNodeRequiredData = (node: Record<string, any>) => {
  // 默认属性
  if (node.default_tag === '') {
    nodesError = [
      ...nodesError,
      {
        name: intl.get('ontoLib.canvasOnto.entityAttributes'),
        value: node.default_tag,
        error: intl.get('ontoLib.errInfo.needDefaultProperty'),
        category: ONTO_CATEGORY.CATEGORY_ATTRIBUTES
      }
    ];
  }
  // 索引和融合
  // if (!node.attributes.length) {
  //   return;
  // }
  let indexErr = true;
  let mergeErr = true;
  _.map(node.attributes, attribute => {
    if (attribute.attrIndex) {
      indexErr = false;
    }
    if (attribute.attrMerge) {
      mergeErr = false;
    }
  });
  if (indexErr) {
    nodesError = [
      ...nodesError,
      {
        name: intl.get('ontoLib.canvasOnto.entityAttrIndex'),
        value: '',
        error: intl.get('ontoLib.errInfo.oneIndex'),
        category: ONTO_CATEGORY.CATEGORY_ATTRIBUTES
      }
    ];
  }
  if (mergeErr) {
    nodesError = [
      ...nodesError,
      {
        name: intl.get('ontoLib.canvasOnto.entityAttrMerge'),
        value: '',
        error: intl.get('ontoLib.errInfo.oneMerge'),
        category: ONTO_CATEGORY.CATEGORY_ATTRIBUTES
      }
    ];
  }
};

const ValidateNodeOptionalData = (node: Record<string, any>) => {
  // 同义词
  _.map(
    node.synonyms.filter((e: any) => e && e.trim()),
    (synonym: string, index: number) => {
      ValidateNodeName(
        {
          value: synonym,
          valueName: intl.get('ontoLib.canvasOnto.entitySynonyms'),
          maxLen: 255,
          TEST: ceLettersNumber_,
          TEST_ERR: 'ceLettersNumber_'
        },
        true,
        ONTO_CATEGORY.CATEGORY_DETAIL,
        { valueArr: node.synonyms, index }
      );
    }
  );
  // 描述
  ValidateNodeName(
    {
      value: node.describe,
      valueName: intl.get('ontoLib.canvasOnto.entityDescribe'),
      maxLen: 255,
      TEST: ceLettersNumberSymbols,
      TEST_ERR: 'ceLettersNumberSymbols'
    },
    false,
    ONTO_CATEGORY.CATEGORY_DETAIL
  );
  // 属性名
  const attrNames = node.attributes.map((item: any) => {
    return item.attrName;
  });
  _.map(attrNames, (attrName: string, index: number) => {
    ValidateNodeName(
      {
        value: attrName,
        valueName: `${intl.get('createEntity.ec')}${intl.get('ontoLib.canvasOnto.entityAttrName')}`,
        maxLen: 255,
        TEST: eLettersNumber_,
        TEST_ERR: 'eLettersNumber_'
      },
      true,
      ONTO_CATEGORY.CATEGORY_ATTRIBUTES,
      { valueArr: attrNames, index }
    );
  });
  // 属性显示名
  const attrDisplayNames = node.attributes.map((item: any) => {
    return item.attrDisplayName;
  });
  _.map(attrDisplayNames, (attrDisplayName: string, index: number) => {
    ValidateNodeName(
      {
        value: attrDisplayName,
        valueName: `${intl.get('createEntity.ec')}${intl.get('ontoLib.canvasOnto.entityAttrDisplayName')}`,
        maxLen: 255,
        TEST: ceLettersNumber_,
        TEST_ERR: 'ceLettersNumber_'
      },
      true,
      ONTO_CATEGORY.CATEGORY_ATTRIBUTES,
      { valueArr: attrDisplayNames, index }
    );
  });
  // 属性同义词
  const attrSynonyms = node.attributes.map((item: any) => {
    return item.attrSynonyms;
  });
  _.map(attrSynonyms, attrSynonym => {
    _.map(
      attrSynonym.filter((e: any) => e && e.trim()),
      (synonym: string, index: number) => {
        ValidateNodeName(
          {
            value: synonym,
            valueName: intl.get('ontoLib.canvasOnto.attributesSynonyms'),
            maxLen: 255,
            TEST: ceLettersNumber_,
            TEST_ERR: 'ceLettersNumber_'
          },
          true,
          ONTO_CATEGORY.CATEGORY_ATTRIBUTES,
          { valueArr: attrSynonym, index }
        );
      }
    );
  });
  // 属性描述
  const attrDescribes = node.attributes.map((item: any) => {
    return item.attrDescribe;
  });
  _.map(attrDescribes, attrDescribe => {
    ValidateNodeName(
      {
        value: attrDescribe,
        valueName: `${intl.get('ontoLib.canvasOnto.entityAttributes')}${intl.get(
          'ontoLib.canvasOnto.attributesDescribe'
        )}`,
        maxLen: 255,
        TEST: ceLettersNumberSymbols,
        TEST_ERR: 'ceLettersNumberSymbols'
      },
      false,
      ONTO_CATEGORY.CATEGORY_ATTRIBUTES
    );
  });
};

const ValidateEdgeOptionalData = (edge: Record<string, any>) => {
  // 同义词
  _.map(
    edge.synonyms?.filter((e: any) => e && e.trim()),
    (synonym: string, index: number) => {
      ValidateEdgeName(
        {
          value: synonym,
          valueName: intl.get('ontoLib.canvasEdge.edgeSynonyms'),
          maxLen: 255,
          TEST: ceLettersNumber_,
          TEST_ERR: 'ceLettersNumber_'
        },
        true,
        ONTO_CATEGORY.CATEGORY_DETAIL,
        { valueArr: edge.synonyms, index }
      );
    }
  );
  // 描述
  ValidateEdgeName(
    {
      value: edge.describe || '',
      valueName: `${intl.get('ontoLib.edge')}${intl.get('ontoLib.canvasEdge.edgeDescribe')}`,
      maxLen: 255,
      TEST: ceLettersNumberSymbols,
      TEST_ERR: 'ceLettersNumberSymbols'
    },
    false,
    ONTO_CATEGORY.CATEGORY_DETAIL
  );
  // 属性名
  const attrNames = edge.attributes?.map((item: any) => {
    return item.attrName;
  });
  _.map(attrNames, (attrName: string, index: number) => {
    ValidateEdgeName(
      {
        value: attrName,
        valueName: `${intl.get('ontoLib.edge')}${intl.get('ontoLib.canvasEdge.edgeAttrName')}`,
        maxLen: 255,
        TEST: eLettersNumber_,
        TEST_ERR: 'eLettersNumber_'
      },
      true,
      ONTO_CATEGORY.CATEGORY_ATTRIBUTES,
      { valueArr: attrNames, index }
    );
  });
  // 属性显示名
  const attrDisplayNames = edge.attributes?.map((item: any) => {
    return item.attrDisplayName;
  });
  _.map(attrDisplayNames, (attrDisplayName: string, index: number) => {
    ValidateEdgeName(
      {
        value: attrDisplayName,
        valueName: `${intl.get('ontoLib.edge')}${intl.get('ontoLib.canvasEdge.edgeAttrDisplayName')}`,
        maxLen: 255,
        TEST: ceLettersNumber_,
        TEST_ERR: 'ceLettersNumber_'
      },
      true,
      ONTO_CATEGORY.CATEGORY_ATTRIBUTES,
      { valueArr: attrDisplayNames, index }
    );
  });
  // 属性同义词
  const attrSynonyms = edge.attributes?.map((item: any) => {
    return item.attrSynonyms;
  });
  _.map(attrSynonyms, attrSynonym => {
    _.map(
      attrSynonym.filter((e: any) => e && e.trim()),
      (synonym: string, index: number) => {
        ValidateEdgeName(
          {
            value: synonym,
            valueName: intl.get('ontoLib.canvasEdge.attributesSynonyms'),
            maxLen: 255,
            TEST: ceLettersNumber_,
            TEST_ERR: 'ceLettersNumber_'
          },
          true,
          ONTO_CATEGORY.CATEGORY_ATTRIBUTES,
          { valueArr: attrSynonym, index }
        );
      }
    );
  });
  // 属性描述
  const attrDescribes = edge.attributes?.map((item: any) => {
    return item.attrDescribe;
  });
  _.map(attrDescribes, attrDescribe => {
    ValidateEdgeName(
      {
        value: attrDescribe,
        valueName: `${intl.get('ontoLib.canvasEdge.edgeAttributes')}${intl.get(
          'ontoLib.canvasEdge.attributesDescribe'
        )}`,
        maxLen: 255,
        TEST: ceLettersNumberSymbols,
        TEST_ERR: 'ceLettersNumberSymbols'
      },
      false,
      ONTO_CATEGORY.CATEGORY_ATTRIBUTES
    );
  });
};

const ValidateNodeName = (
  data: TestNameDataType,
  emptyCheck = true,
  category: ONTO_CATEGORY,
  repeat?: RepeatOption
) => {
  // 不能为空
  if (emptyCheck) {
    if (data.value === '') {
      nodesError = [
        ...nodesError,
        { name: data.valueName, value: data.value, error: intl.get('ontoLib.errInfo.emptyInput'), category }
      ];
      return;
    }
  }
  // 不做非空校验的，遇到空值，直接return
  if (!emptyCheck && data.value === '') {
    return;
  }
  // 长度不超过data.maxLen
  if (data.value.length > data.maxLen) {
    nodesError = [
      ...nodesError,
      {
        name: data.valueName,
        value: data.value,
        error: intl.get('ontoLib.errInfo.maxLen', { len: data.maxLen }),
        category
      }
    ];
  }
  // 允许输入的值
  if (!data.TEST.test(data.value)) {
    nodesError = [
      ...nodesError,
      { name: data.valueName, value: data.value, error: intl.get(`ontoLib.errInfo.${data.TEST_ERR}`), category }
    ];
  }
  // 不允许重复
  if (_.some(repeat?.valueArr, (d, i) => d === data.value && i !== repeat?.index)) {
    nodesError = [
      ...nodesError,
      {
        name: data.valueName,
        value: data.value,
        error: intl.get('global.repeatName'),
        category
      }
    ];
  }
};

const ValidateEdgeName = (
  data: TestNameDataType,
  emptyCheck = true,
  category: ONTO_CATEGORY,
  repeat?: RepeatOption
) => {
  // 不能为空
  if (emptyCheck) {
    if (data.value === '') {
      edgesError = [
        ...edgesError,
        { name: data.valueName, value: data.value, error: intl.get('ontoLib.errInfo.emptyInput'), category }
      ];
      return;
    }
  }
  // 不做非空校验的，遇到空值，直接return
  if (!emptyCheck && data.value === '') {
    return;
  }
  // 长度不超过data.maxLen
  if (data.value.length > data.maxLen) {
    edgesError = [
      ...edgesError,
      {
        name: data.valueName,
        value: data.value,
        error: intl.get('ontoLib.errInfo.maxLen', { len: data.maxLen }),
        category
      }
    ];
  }
  // 允许输入的值
  if (!data.TEST.test(data.value)) {
    edgesError = [
      ...edgesError,
      { name: data.valueName, value: data.value, error: intl.get(`ontoLib.errInfo.${data.TEST_ERR}`), category }
    ];
  }
  // 不允许重复
  if (_.some(repeat?.valueArr, (d, i) => d === data.value && i !== repeat?.index)) {
    edgesError = [
      ...edgesError,
      {
        name: data.valueName,
        value: data.value,
        error: intl.get('global.repeatName'),
        category
      }
    ];
  }
};
