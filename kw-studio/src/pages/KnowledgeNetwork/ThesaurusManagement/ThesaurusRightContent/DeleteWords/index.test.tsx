import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import DeleteModal from './index';
import { act } from '@/tests';

jest.mock('@/services/thesaurus', () => ({
  thesaurusDeleteWords: () => Promise.resolve({ res: 'success' })
}));

const defaultProps = {
  isVisible: true,
  deleteType: 'one',
  page: 1,
  deleteValue: [
    { word: '伤心', homoionym: '难过' },
    { word: '悲伤', homoionym: '难过' }
  ],
  closeModal: jest.fn(),
  selectedThesaurus: { id: 1 },
  getThesaurusById: jest.fn()
};
const init = (props = defaultProps) => mount(<DeleteModal {...props} store={store} />);

describe('DeleteModal', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('click ok', () => {
  const wrapper = init();

  act(() => {
    wrapper.find('.delete-ok').at(0).simulate('click');
    wrapper.find('.delete-cancel').at(0).simulate('click');
  })
})
