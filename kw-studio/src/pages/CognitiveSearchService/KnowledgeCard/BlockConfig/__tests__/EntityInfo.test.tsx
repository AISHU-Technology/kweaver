import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import { mockOnto, mockEntityInfo } from '../../__tests__/mockData';
import EntityInfo from '../EntityInfo';

const defaultProps: any = {
  node: mockOnto.entity[0],
  data: mockEntityInfo,
  onChange: jest.fn()
};
const init = (props = defaultProps) => mount(<EntityInfo {...props} />);

describe('KnowledgeCard/BlockConfig/EntityInfo', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
