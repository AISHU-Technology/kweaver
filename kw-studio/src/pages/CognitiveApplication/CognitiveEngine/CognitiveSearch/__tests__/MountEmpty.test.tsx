import React from 'react';
import { mount } from 'enzyme';
import MountEmpty, { MountEmptyProps } from '../MountEmpty';

const defaultProps = {
  initLoading: false,
  isNotGraph: false,
  isNotConfig: false,
  isManager: false,
  kgData: {}
};
const init = (props: MountEmptyProps = defaultProps) => mount(<MountEmpty {...props} />);

describe('CognitiveSearch/MountEmpty', () => {
  it('test render', async () => {
    const wrapper = init();

    wrapper.setProps({ isNotGraph: true, isManager: true });
    expect(wrapper.find('.create-span')).toBeDefined();

    wrapper.setProps({ isNotConfig: true, isManager: false });
    expect(wrapper.hasClass('empty-content')).toBeDefined();

    wrapper.setProps({ initLoading: true });
    expect(wrapper.hasClass('loading-mask')).toBeDefined();
  });
});
