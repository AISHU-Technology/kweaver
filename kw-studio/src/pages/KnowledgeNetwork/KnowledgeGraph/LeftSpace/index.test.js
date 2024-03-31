import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import store from '@/reduxConfig/store';
import LeftSpace from './index';

const props = {
  graphList: [{ name: 'aaa', id: 1 }],
  graphListCount: 1,
  setSelectedGraph: () => {},
  selectedGraph: { id: 1 },
  getGraphList: () => {},
  selectedKnowledge: { id: 1 },
  setLeftChangePage: () => {}
};

const init = (props = {}) => mount(<LeftSpace {...props} store={store} />);

describe('Function', () => {
  it('input', async () => {
    const wrapper = init(props);
    const input = wrapper.find('.ant-input');

    act(() => {
      input.at(0).simulate('change', { target: { value: 'aaa' } });
    });
    await sleep();
  });

  it('click graph', () => {
    const wrapper = init(props);
    const name = wrapper.find('.line');

    act(() => {
      name.at(0).simulate('click');
    });
  });
});
