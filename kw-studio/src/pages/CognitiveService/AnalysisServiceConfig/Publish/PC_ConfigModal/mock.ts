import intl from 'react-intl-universal';
import { parseCommonResult } from '@/pages/KnowledgeNetwork/ExploreGraph/LeftSpace/components/ResultPanel';

export const mockGraph = parseCommonResult({
  nodes: [
    {
      id: '1',
      alias: '演示',
      color: '#faad14',
      class_name: 'mockNode1',
      default_property: { name: 'name', value: intl.get('analysisService.demo1'), alias: 'name' },
      tags: ['mockNode1'],
      properties: [
        {
          tag: 'mockNode1',
          props: [
            {
              name: 'name',
              value: intl.get('analysisService.demo1'),
              alias: 'name',
              type: 'string',
              disabled: false,
              checked: true
            }
          ]
        }
      ]
    },
    {
      id: '2',
      alias: '演示',
      color: '#126ee3',
      class_name: 'mockNode2',
      default_property: { name: 'name', value: intl.get('analysisService.demo2'), alias: 'name' },
      tags: ['mockNode2'],
      properties: [
        {
          tag: 'mockNode2',
          props: [
            {
              name: 'name',
              value: intl.get('analysisService.demo2'),
              alias: 'name',
              type: 'string',
              disabled: false,
              checked: true
            }
          ]
        }
      ]
    }
  ],
  edges: [
    {
      id: 'edge:1-2',
      alias: 'relationship',
      color: '#000',
      class_name: 'relationship',
      source: '1',
      target: '2',
      properties: [
        {
          name: 'name',
          value: 'relationship',
          alias: 'name',
          type: 'string',
          disabled: false,
          checked: false
        }
      ]
    }
  ]
}).graph;
