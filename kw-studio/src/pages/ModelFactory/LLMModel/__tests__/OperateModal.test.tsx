import React from 'react';
import { mount } from 'enzyme';
import OperateModal from '../components/OperateModal';
import { template } from '../template';
import { parseModelConfig } from '../utils';

const defaultProps = {
  modelConfig: parseModelConfig(template),
  visible: true,
  action: 'create',
  data: {},
  onOk: jest.fn(),
  onCancel: jest.fn()
};
const init = (props = defaultProps) => mount(<OperateModal {...props} />);

describe('LLMModel/components/OperateModal', () => {
  it('test', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
