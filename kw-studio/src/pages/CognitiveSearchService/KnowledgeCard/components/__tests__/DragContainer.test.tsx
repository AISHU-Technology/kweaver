import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import DragContainer from '../DragContainer';

const defaultProps = {
  refreshKey: 1,
  source: [],
  activeID: '',
  onChangeSort: jest.fn(),
  onChangeActive: jest.fn(),
  onDeleteComponent: jest.fn()
};
const init = (props = defaultProps) => mount(<DragContainer {...props} />);

describe('KnowledgeCard/components/DragContainer', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
