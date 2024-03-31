import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import TaskList from '../index';

const defaultProps = { selectedGraph: { id: 1, kg_conf_id: 1 }, tabsKey: '3', onUpdateGraphStatus: jest.fn() };
const init = (props = defaultProps) => mount(<TaskList {...props} store={store} />);

describe('UI test', () => {
  it('should render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
