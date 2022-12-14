import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ScoreCard from '../ScoreCard';

const defaultProps = { title: '知识量得分', icon: <div />, color: { r: 1, g: 2, b: 3 } };
const init = (props = defaultProps) => mount(<ScoreCard {...props} />);

describe('Statistics/ScoreCard', () => {
  it('test render', () => {
    const wrapper = init();
    expect(wrapper.find('.h-info div').at(0).text()).toBe(defaultProps.title);

    wrapper.setProps({ score: 66 });
    expect(wrapper.find('.h-info div').at(1).text()).toBe('66');

    wrapper.setProps({ children: 'children' });
    expect(wrapper.findWhere(node => node.text() === 'children').exists()).toBe(true);
  });

  it('test open and close', () => {
    const wrapper = init();
    expect(wrapper.find('.expand-btn').text().trim()).toBe('查看详情');
    act(() => {
      wrapper.find('.expand-btn').simulate('click');
    });
    expect(wrapper.find('.expand-btn').text().trim()).toBe('收起详情');
    act(() => {
      wrapper.find('.expand-btn').simulate('click');
    });
    expect(wrapper.find('.expand-btn').text().trim()).toBe('查看详情');
  });
});
