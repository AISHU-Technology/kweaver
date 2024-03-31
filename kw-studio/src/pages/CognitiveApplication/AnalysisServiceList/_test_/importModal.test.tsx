import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ImportModal from '../ImportModal';
import { KnwItem } from '.././types';
import { knData } from './mockData';

jest.mock('@/services/analysisService', () => ({
  analysisServiceImport: jest.fn(() => Promise.resolve({ res: 'ok' })),
  analysisServiceDownload: jest.fn(() => Promise.resolve({}))
}));

type importType = {
  onHandleCancel: () => void;
  knData: KnwItem;
  visible: boolean;
};
const defaultProps = {
  knData,
  visible: true,
  onHandleCancel: jest.fn()
};
const init = (props: importType) => mount(<ImportModal {...props} />);
describe('UI is render', () => {
  const wrapper = init(defaultProps);
  expect(wrapper.exists()).toBe(true);
});

describe('Function is called', () => {
  const wrapper = init(defaultProps);
  it('test download template', async () => {
    act(() => {
      wrapper.find('.down-style').at(0).simulate('click');
    });
  });
  it('test import empty', async () => {
    act(() => {
      wrapper.find('Input').at(0).simulate('click');
    });
  });
  it('test cancel', async () => {
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
  });
});
