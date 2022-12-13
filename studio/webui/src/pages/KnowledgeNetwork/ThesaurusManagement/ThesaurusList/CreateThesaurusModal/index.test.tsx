import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';

import CreateThesaurus from './index';

jest.mock('@/services/thesaurus', () => ({
  thesaurusCreate: () => Promise.resolve({ ErrorCode: 'Builder.LexiconController.CreateLexicon.DuplicatedName' }),
  thesaurusLabelList: () => Promise.resolve({ res: ['label1', 'label2', 'label3'] })
}));

const defaultProps = {
  isVisible: true,
  knowledge: { id: 1 },
  closeModal: jest.fn(),
  getThesaurusList: jest.fn(),
  setPage: jest.fn()
};
const init = (props = defaultProps) => mount(<CreateThesaurus {...props} />);

describe('CreateThesaurus', () => {
  it('test render', async () => {
    const wrapper = init();

    expect(wrapper.exists()).toBe(true);
  });
});

describe('create test', () => {
  it('onClick', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

    act(() => {
      wrapper
        .find('.ant-input')
        .first()
        .simulate('change', { target: { value: '123' } });
    });

    act(() => {
      wrapper.find('.ant-btn').at(1).simulate('click');
    });
  });
});
