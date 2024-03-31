import React from 'react';
import IntentionCreate from '../index';
import { mount } from 'enzyme';
import { act, triggerPropsFunc } from '@/tests';
import { knData } from '../../mockData';

jest.mock('@/services/intention', () => ({
  editIntentPool: () => Promise.resolve({ res: {} }),
  trainModel: () => Promise.resolve({ res: 'ok' })
}));

const defaultProps = {
  knData,
  knwStudio: 'studio'
};

const init = (props = defaultProps) => mount(<IntentionCreate {...props} />);

describe('test UI', () => {
  it('test text UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.kw-exit-bar')).toHaveLength(1);
    expect(wrapper.find('.bottom-btn').find('Button').at(0).text()).toBe('保存并退出');
    expect(wrapper.find('.bottom-btn').find('Button').at(1).text()).toBe('提交训练');
  });
});

describe('Function test', () => {
  it('btn click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.kw-exit-bar .kw-btn-text').at(0).simulate('click');
    });
    // act(() => {
    //   wrapper.find('.intention-name').at(0).simulate('click');
    // });
    act(() => {
      wrapper.find('.bottom-btn').find('Button').at(0).simulate('click');
    });
    act(() => {
      wrapper.find('.bottom-btn').find('Button').at(1).simulate('click');
    });
  });

  it('test upload', async () => {
    const wrapper = init();
    act(() => {
      triggerPropsFunc(wrapper.find('.content-right').at(0).find('IntentionTable'), 'onUploadDocument');
    });
  });
});
