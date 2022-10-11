import React from 'react';
import { mount } from 'enzyme';
import Header, { HeaderType } from './index';

const init = (props: HeaderType = {}) => mount(<Header {...props} />);

describe('Header', () => {
  it('test logo', () => {
    const wrapper = init();
    expect(wrapper.find('.logo').exists()).toBe(false);
    wrapper.setProps({ logo: 'logo.svg' });
    expect(wrapper.find('.logo').exists()).toBe(true);
  });

  it('test styles', () => {
    const props = {
      className: 'test-className',
      style: { height: 66 }
    };
    const wrapper = init(props);
    expect(wrapper.hasClass(props.className)).toBe(true);
    expect(wrapper.find(`.${props.className}`).at(0).props().style).toEqual(props.style);
  });

  it('test render operation', () => {
    const operation = [
      { float: 'left', text: 'home', onClick: () => '/home' },
      {
        float: 'right',
        text: 'icon',
        icon: <img src="test.svg" />
      },
      {
        component: () => <button>btn</button>
      }
    ];
    const wrapper = init({ operation });
    expect(wrapper.findWhere(node => node.text() === 'home').exists()).toBe(true);
    expect(wrapper.findWhere(node => node.text() === 'icon').exists()).toBe(true);
    expect(wrapper.findWhere(node => node.text() === 'btn').exists()).toBe(true);
  });
});
