import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import BrushSelectDialog from './index';

const defaultProps = {
  visible: true,
  nodeLen: 0,
  edgeLen: 0,
  onCancel: jest.fn(),
  onOk: jest.fn()
};
const init = (props = defaultProps) => mount(<BrushSelectDialog {...props} />);

describe('BrushSelectDialog', () => {
  it('test render', () => {
    const wrapper = init();
    wrapper.setProps({ nodeLen: 2, edgeLen: 1 });
    expect(wrapper.find('.op-text > span').first().text().trim()).toBe('2');
    expect(wrapper.find('.op-text > span').last().text().trim()).toBe('1');
    wrapper.setProps({ visible: false });
    expect(wrapper.find('.group-op-dialog').props().style?.display).toBe('none');
  });

  it('test ', () => {
    const wrapper = init();
    const spyOk = jest.spyOn(wrapper.props(), 'onOk');
    const spyCancel = jest.spyOn(wrapper.props(), 'onCancel');
    act(() => {
      wrapper.find('.g-btn').first().simulate('click');
    });
    expect(spyCancel).toHaveBeenCalled();
    act(() => {
      wrapper.find('.g-btn').last().simulate('click');
    });
    expect(spyOk).toHaveBeenCalled();
  });
});
