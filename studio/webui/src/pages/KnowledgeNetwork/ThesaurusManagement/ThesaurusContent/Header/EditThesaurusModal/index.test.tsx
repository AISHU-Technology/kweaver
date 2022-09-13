import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';

import EditThesaurus from './index';

jest.mock('@/services/thesaurus', () =>
({
  thesaurusEdit: () => Promise.resolve({ ErrorCode: 'Builder.LexiconController.CreateLexicon.DuplicatedName' }),
  thesaurusLabelList: () => Promise.resolve({ res: ['label1', 'label2', 'label3'] })
})
)
const defaultProps = {
  isVisible: true,
  knowledge: {},
  closeModal: jest.fn(),
  getThesaurusList: jest.fn(),
  selectedThesaurus: { id: 1, lexicon_name: '名字' }
};
const init = (props = defaultProps) => mount(<EditThesaurus {...props} />);

describe('EditThesaurus', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('test ok', () => {
  it('edit', async () => {
    const wrapper = init();
    wrapper.setProps({ isVisible: true })
    act(() => {
      wrapper.find('.ant-btn').at(1).simulate('click');
    })
    await sleep();
  })
})