import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import DeleteModal from './index';
import { act } from '@/tests';

jest.mock('@/services/thesaurus', () =>
  () => Promise.resolve({ res: 'success' })
)

const defaultProps = {
  isVisible: true,
  thesaId: 1,
  closeModal: jest.fn(),
  getThesaurusList: jest.fn()
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
