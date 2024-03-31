import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import SaveAnalysis from '.';

const defaultProps = {
  detail: {},
  selectedItem: { detail: { canvas_name: 'aa', canvas_info: 'bbb' } },
  saveModalFields: [],
  onClose: jest.fn(),
  onSaveOk: jest.fn()
};

const init = (props = defaultProps) => mount(<SaveAnalysis {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('bottom test', () => {
  it('ok test', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-btn').at(0).simulate('click');
    });
    await sleep();
  });
});
