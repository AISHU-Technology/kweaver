import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import WeightSortingModal from '../WeightSortingModal';

const defaultProps = {
  visible: true,
  graphSources: [],
  data: [],
  onCancel: jest.fn(),
  onOk: jest.fn()
};
const init = (props = defaultProps) => mount(<WeightSortingModal {...props} />);

describe('KnowledgeCard/components/WeightSortingModal', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
