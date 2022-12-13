import React from 'react';
import { mount } from 'enzyme';
import ThesaurusList from './index';
import { act } from 'react-test-renderer';
import { sleep } from '@/tests';

jest.mock('@/services/thesaurus', () => ({ thesaurusExport: () => Promise.resolve({ res: 'success' }) }));

const defaultProps = {
  thesaurusList: [
    { id: 1, name: 'ciku1', columns: [], status: 'success', error_info: '' },
    { id: 2, name: 'ciku2', columns: ['a', 'b'], status: 'failed', error_info: 'xxxxxx' },
    { id: 3, name: 'ciku3', columns: [], status: 'running', error_info: '' }
  ],
  selectedThesaurus: {
    id: 1,
    lexicon_name: 'ciku1',
    description: 'xxxxxxxxxxxx',
    labels: ['label1', 'label2', 'label3'],
    create_user: 'xiaoming',
    operate_user: 'xiaohong',
    create_time: '2022-07-25 13:47:46',
    update_time: '2022-07-25 13:47:46',
    count: 500,
    columns: ['word', 'homoionym'],
    status: 'success',
    error_info: '',
    word_info: [
      { word: '开心', homoionym: '高兴' },
      { word: '不开心', homoionym: '不高兴' },
      { word: '不开心', homoionym: '伤心' }
    ]
  },
  thesaurusListCount: 21,
  knowledge: { id: 3 },
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
  it('selectChange', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

    act(() => {
      wrapper
        .find('.ant-checkbox-input')
        .at(0)
        .simulate('change', { target: { checked: true } });
    });
    await sleep();
    wrapper.update();

    act(() => {
      wrapper
        .find('.ant-checkbox-input')
        .at(2)
        .simulate('change', { target: { checked: false } });
    });
    await sleep();

    act(() => {
      wrapper.find('.operate-btn').at(2).simulate('click');
    });
  });

  it('changepage', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-pagination-item').at(1).simulate('click');
    });
  });

  it('search', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

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
