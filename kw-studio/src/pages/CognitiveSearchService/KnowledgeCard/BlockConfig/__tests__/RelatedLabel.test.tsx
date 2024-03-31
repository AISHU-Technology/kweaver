import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import { mockOnto, mockRelatedLabel } from '../../__tests__/mockData';
import RelatedLabel from '../RelatedLabel';

const defaultProps: any = {
  knwId: 1,
  type: 'card',
  node: mockOnto.entity[0],
  ontoData: mockOnto,
  data: mockRelatedLabel,
  onChange: jest.fn(),
  onViewOntology: jest.fn()
};
const init = (props = defaultProps) => mount(<RelatedLabel {...props} />);

describe('KnowledgeCard/BlockConfig/RelatedLabel', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
