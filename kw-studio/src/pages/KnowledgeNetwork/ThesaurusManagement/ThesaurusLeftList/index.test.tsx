import React from 'react';
import { mount } from 'enzyme';
import ThesaurusList from './index';
import { act } from 'react-test-renderer';
import { sleep } from '@/tests';

jest.mock('@/services/thesaurus', () => ({ thesaurusExport: () => Promise.resolve({ res: 'success' }) }));

const defaultProps = {
  thesaurusList: [
    { id: 1, name: 'ciku1' },
    { id: 2, name: 'ciku2' },
    { id: 3, name: 'ciku3' }
  ],
  selectedThesaurus: { id: 1 },
  thesaurusListCount: 21,
  knowledge: {},
  listPage: 1,
  errorInfo: 'hh',
  createModalVisible: false,
  setCreateModalVisible: jest.fn(),
  getThesaurusById: jest.fn(),
  getThesaurusList: jest.fn()
};
const init = (props = defaultProps) => mount(<ThesaurusList {...props} />);

describe('ThesaurusList', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('check box', () => {
  it('click-row', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.list-item').at(0).simulate('click');
    });
  });

  it('search', () => {
    const wrapper = init();

    const mockEvent = {
      keyCode: 13,
      target: {
        value: 'aaa'
      }
    };
    act(() => {
      wrapper.find('.ant-input').at(0).simulate('keyup', mockEvent);
    });
  });
});
