import React from 'react';
import { shallow } from 'enzyme';
import GraphDetail from './index';
import { constructGraphData } from './assistant';

describe('Assistant', () => {
  const data = {
    nodes: [
      {
        alias: '合同',
        arrowOffset: 7,
        color: '#3E52B5',
        count: 2,
        entity_id: 1,
        level: 1,
        name: 'contract',
        size: 24,
        uid: 'contract'
      }
    ],
    edges: [
      {
        alias: '包含',
        color: '#3E52B5',
        count: 34,
        edge_id: 1,
        name: 'contain',
        relation: ['contract', 'contain', 'clause'],
        uid: 'contract->contain->clause'
      }
    ]
  };
  const result = constructGraphData(data);
  const { nodes, edges } = result;
  it('node id same as uid before conversion', () => {
    expect(nodes[0].id).toBe(data.nodes[0].uid);
  });
  it('edge id same as uid before conversion', () => {
    expect(edges[0].id).toBe(data.edges[0].uid);
  });
  it('edge target same as third element of the relation', () => {
    expect(edges[0].target).toBe(data.edges[0].relation[2]);
  });
});

describe('GraphDetail', () => {
  const props = { graphid: 1, tabsKey: '1', isFetching: false, graphBasicData: {}, onRefresh: () => {} };
  jest.mock('@/hooks', () => ({
    PaginationConfig: () => ({ pagination: { page: 1, pageSize: 10 }, onUpdatePagination: () => {} })
  }));

  it('GraphDetail have graphBox', () => {
    const app = shallow(<GraphDetail {...props} />);
    expect(app.find('.graphDetailRoot').children().at(0).hasClass('graphBox')).toBe(true);
  });
});
