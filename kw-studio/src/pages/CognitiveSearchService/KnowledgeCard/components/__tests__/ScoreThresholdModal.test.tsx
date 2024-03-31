import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ScoreThresholdModal from '../ScoreThresholdModal';

const defaultProps = {
  visible: true,
  score: 0.8,
  onCancel: jest.fn(),
  onOk: jest.fn()
};
const init = (props = defaultProps) => mount(<ScoreThresholdModal {...props} />);

describe('KnowledgeCard/components/ScoreThresholdModal', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
