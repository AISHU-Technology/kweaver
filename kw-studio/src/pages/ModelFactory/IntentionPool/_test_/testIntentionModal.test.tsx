import React from 'react';
import TestIntentionModal from '../TestIntentionModal';
import { mount } from 'enzyme';
import { act } from '@/tests';

jest.mock('@/services/intention', () => ({
  testIntentModel: jest.fn(() => Promise.resolve({ res: '成功' }))
}));

const defaultProps = {
  setIsAgain: jest.fn(),
  isTestModal: true,
  handleCancel: jest.fn(),
  testId: 0,
  name: '',
  setName: jest.fn(),
  isAgain: false
};

const init = (props: any) => mount(<TestIntentionModal {...props} />);

describe('UI test', () => {
  it('test loading', () => {
    const wrapper = init({ ...defaultProps, testSuccess: false });
    expect(wrapper.find('.loading').at(0).text()).toBe('正在加载模型，请稍等...');
  });
  it('test testSuccess true', () => {
    const wrapper = init({ ...defaultProps, testSuccess: false });
    expect(wrapper.find('.kw-c-watermark').at(0).exists()).toBe(true);
  });
});

describe('Function test', () => {
  it('test search input', async () => {
    const wrapper = init({ ...defaultProps, testSuccess: true });
    act(() => {
      wrapper.find('Input').at(0).simulate('keydown', { key: 'Enter' });
    });
    act(() => {
      wrapper.find('.kw-c-watermark').at(0).simulate('click');
    });
  });
});
