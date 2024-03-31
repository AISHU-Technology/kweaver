import React from 'react';
import IntentionInfo from '../IntentionInfo';
import { mount } from 'enzyme';
import { act, triggerPropsFunc } from '@/tests';
import { knData } from '../../mockData';

jest.mock('@/services/intention', () => ({
  downTemplate: () => Promise.resolve({ res: {} }),
  addIntentPool: () => Promise.resolve({ res: 'ok' }),
  updateIntentPool: () => Promise.resolve({ res: 'ok' })
}));

const defaultProps = {
  knData,
  editMes: {},
  setNameInput: jest.fn(),
  setFileUpLoad: jest.fn(),
  slotDes: '',
  setSlotDes: jest.fn(),
  setIconShow: jest.fn(),
  docContent: [],
  setDocContent: jest.fn(),
  setDocName: jest.fn(),
  setIsUpload: jest.fn()
};

const init = (props: any) => mount(<IntentionInfo {...props} />);

describe('test UI', () => {
  it('test create', () => {
    const wrapper = init({ ...defaultProps, isUpload: false, docName: '' });
    expect(wrapper.find('.basic-mes').at(0).text()).toBe('基本信息');
    expect(wrapper.find('.input-name').at(0).text()).toBe('意图池名称');
    expect(wrapper.find('.basic-mes').at(1).text()).toBe('配置信息');
    // expect(wrapper.find('.input-name').at(1).text()).toBe('训练数据 (0/1)');
    expect(wrapper.find('Button').at(0).text()).toBe('上传数据');
  });
  it('test edit', () => {
    const wrapper = init({ ...defaultProps, isUpload: false, docName: '' });
  });
});

describe('Function test', () => {
  it('btn click', async () => {});
});
