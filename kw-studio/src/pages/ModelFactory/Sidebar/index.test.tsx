import React from 'react';
import { shallow } from 'enzyme';
import Sidebar from './index';

const init = (props: any) => shallow(<Sidebar {...props} />);

describe('Sidebar', () => {
  it('component is exists', () => {
    const wrapper = init({ score: 12, kwLang: 'zh_CN' });
    expect(wrapper.exists()).toBe(true);
  });
});
