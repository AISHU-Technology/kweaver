import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import { mockOnto, mockRelatedDoc1, mockRelatedDoc2 } from '../../__tests__/mockData';
import RelatedDocument from '../RelatedDocument';

const defaultProps: any = {
  knwId: 1,
  type: 'card',
  node: mockOnto.entity[0],
  ontoData: mockOnto,
  data: mockRelatedDoc1,
  onChange: jest.fn(),
  onViewOntology: jest.fn()
};
const init = (props = defaultProps) => mount(<RelatedDocument {...props} />);

describe('KnowledgeCard/BlockConfig/RelatedDocument', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
