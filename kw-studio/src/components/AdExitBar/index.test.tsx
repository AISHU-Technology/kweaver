import React from 'react';
import { shallow } from 'enzyme';
import AdExitBar from './AdExitBar';

const defaultProps = {
  onExit: jest.fn(),
  title: '测试',
  className: 'my-exit-bar'
};
const init = (props = defaultProps) => shallow(<AdExitBar {...props} />);

describe('AdExitBar UI', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.kw-exit-bar')).toHaveLength(1);
  });
});
