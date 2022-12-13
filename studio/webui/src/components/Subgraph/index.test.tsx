import React from 'react';
import { mount } from 'enzyme';
import ChildGraph from './index';

const props = {
  graphData: {
    entity: [
      {
        entity_id: 1,
        colour: '#8BC34A',
        ds_name: '',
        name: 'contract',
        alias: '合同'
      }
    ],
    edge: [
      {
        edge_id: 1,
        colour: '#607D8B',
        name: 'contain',
        properties_index: ['name'],
        relations: ['contract', 'contain', 'clause'],
        alias: '包含'
      }
    ]
  }
};

const init = (props: any) => mount(<ChildGraph {...props} />);

describe('ChildGraph', () => {
  it('class childGraph is exists', () => {
    const wrapper = init(props);
    expect(wrapper.find('.childGraphRoot').exists()).toBe(true);
  });
});
