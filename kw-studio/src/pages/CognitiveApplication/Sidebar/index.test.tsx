import React from 'react';
import { shallow } from 'enzyme';
import Sidebar from './index';

const init = (props: any) => shallow(<Sidebar {...props} />);

describe('Sidebar', () => {
  it('component is exists', () => {
    const props = { score: 13, kwLang: 'zh-CN' };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
