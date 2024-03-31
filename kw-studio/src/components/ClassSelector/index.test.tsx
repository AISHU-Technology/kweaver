import React from 'react';
import { shallow } from 'enzyme';
import SelectorClass from './index';

const ontoData = {
  edge: [
    {
      alias: 'edge_alias',
      color: '#68798E',
      edge_id: 14,
      name: 'kom_customer_info_2_kom_sub_industry_info',
      properties: [
        {
          alias: '名称',
          name: 'name',
          type: 'string'
        }
      ],
      relation: ['kom_customer_info', 'kom_customer_info_2_kom_sub_industry_info', 'kom_sub_industry_info']
    }
  ],
  entity: [
    {
      alias: 'entity_alias',
      color: '#68798E',
      default_tag: 'name',
      entity_id: 5,
      icon: '',
      name: 'kom_customer_info',
      properties: [
        {
          alias: '名称',
          name: 'name',
          type: 'string'
        }
      ],
      x: null,
      y: null
    },
    {
      alias: 'kom_sub_industry_info',
      color: '#5C539B',
      default_tag: 'name',
      entity_id: 6,
      icon: '',
      name: 'kom_sub_industry_info',
      properties: [
        {
          alias: '名称',
          name: 'name',
          type: 'string'
        },
        {
          alias: '子行业ID',
          name: 'sub_industry_id',
          type: 'string'
        }
      ],
      x: null,
      y: null
    }
  ]
};

const edgeProps = {
  data: ontoData.edge[0],
  type: 'e_filters' as any, // node type or edge type
  classList: ontoData.edge, // List of all edge classes
  entities: ontoData.entity, // Ontology entity information
  onChange: jest.fn()
};

const nodeProps = {
  data: ontoData.entity[0],
  type: 'v_filters' as any,
  classList: ontoData.entity,
  entities: ontoData.entity,
  onChange: jest.fn()
};

const init = (props: any) => shallow(<SelectorClass {...props} />);

describe('init', () => {
  it('node', () => {
    const wrapper = init(edgeProps);
    expect(wrapper.exists()).toBe(true);
  });

  it('edge', () => {
    const wrapper = init(nodeProps);
    expect(wrapper.exists()).toBe(true);
  });
});
