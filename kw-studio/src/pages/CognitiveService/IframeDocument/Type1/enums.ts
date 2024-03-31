import intl from 'react-intl-universal';
// 服务默认参数
export const DEFAULT_PARAMS = [
  {
    name: 'service_id',
    type: 'string',
    required: true,
    description: intl.get('cognitiveService.iframeDocument.descText')
  },
  {
    name: 's_id',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.snashotsId')
  },
  {
    name: 'operation_type',
    type: 'string',
    required: true,
    description: intl.get('cognitiveService.iframeDocument.serviceType')
  }
];

// 邻居查询默认参数
export const INIT_NEIGHBOR_PARAMS = [
  {
    name: 'vids',
    type: 'array',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.neighborVids')
  },
  {
    name: 'steps',
    type: 'integer',
    required: false,
    defaultValue: 1,
    description: intl.get('cognitiveService.iframeDocument.neighborSteps')
  },
  {
    name: 'direction',
    type: 'string',
    required: false,
    defaultValue: 'positive',
    description: intl.get('cognitiveService.iframeDocument.neighborDirection')
  },
  {
    name: 'final_step',
    type: 'boolean',
    required: false,
    defaultValue: false,
    description: intl.get('analysisService.finalStepExplain')
  }
];

// 最短路径默认参数
export const INIT_SHORTEST_PATH = [
  {
    name: 'source',
    type: 'string',
    required: true,
    description: '起点vid'
  },
  {
    name: 'target',
    type: 'string',
    required: true,
    description: '终点vid'
  },
  {
    name: 'direction',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.neighborDirection')
  },
  {
    name: 'steps',
    type: 'interger',
    required: false,
    description: intl.get('cognitiveService.paths.pathDepth')
  },
  {
    name: 'path_decision',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.paths.pathDecisionDes')
  },
  {
    name: 'edges',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.paths.pathEdgesType')
  },
  {
    name: 'property',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.paths.property')
  },
  {
    name: 'default_value',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.paths.propertyValue')
  }
];

// 全部路径默认参数
export const INIT_ALL_PATH = [
  {
    name: 'source',
    type: 'string',
    required: true,
    description: '起点vid'
  },
  {
    name: 'target',
    type: 'string',
    required: true,
    description: '终点vid'
  },
  {
    name: 'direction',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.iframeDocument.neighborDirection')
  },
  {
    name: 'steps',
    type: 'interger',
    required: false,
    description: intl.get('cognitiveService.paths.pathDepth')
  },
  {
    name: 'path_type',
    type: 'string',
    required: false,
    description: intl.get('cognitiveService.paths.pathType')
  }
];
