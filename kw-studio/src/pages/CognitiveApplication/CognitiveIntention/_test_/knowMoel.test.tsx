import React from 'react';
import { mount } from 'enzyme';
import KnowLedgeModel from '../KnowledgeModal';

const defaultProps = {
  visible: true,
  onCancel: jest.fn(),
  onOk: jest.fn()
};
const init = (props: any) => mount(<KnowLedgeModel {...props} />);
describe('UI', () => {
  it('test UI', () => {
    const wrapper = init(defaultProps);
    expect(wrapper.exists()).toBe(true);
  });
});
