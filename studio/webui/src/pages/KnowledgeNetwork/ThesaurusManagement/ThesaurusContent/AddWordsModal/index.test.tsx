import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import AddWords from './index';

jest.mock('@/services/thesaurus', () => ({
  thesaurusInsertWords: Promise.resolve({ res: 'success' }),
  thesaurusEditWords: Promise.resolve({ res: 'success' })
}))

const defaultProps = {
  type: 'edit',
  columns: [{ dataIndex: 'hhh' }, { dataIndex: 'bbb' }],
  editRecord: { hhh: '111', bbb: '222' },
  selectedThesaurus: { id: 1 },
  getThesaurusById: jest.fn(),
  isVisible: true,
  closeModal: jest.fn()
};
const init = (props = defaultProps) => mount(<AddWords {...props} />);

describe('AddWords', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('click ok', () => {
  it('test edit', async () => {
    const wrapper = init();
    wrapper.setProps({ editRecord: { hhh: '21', bbb: '22' }, type: 'edit' });

    act(() => {
      wrapper.find('.ant-btn').at(1).simulate('click');
    })
    await sleep();
  });

  it('test insert', async () => {
    const wrapper = init();
    wrapper.setProps({ type: 'add' });
    act(() => {
      wrapper.find('.ant-input').at(0).simulate('change', { target: { value: '123' } })

      wrapper.find('.ant-btn').at(1).simulate('click');
    })
    await sleep();
  });
})
