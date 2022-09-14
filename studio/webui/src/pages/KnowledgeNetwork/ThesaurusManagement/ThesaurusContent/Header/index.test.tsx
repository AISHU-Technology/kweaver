import React from 'react';
import { mount } from 'enzyme';
import ThesaurusHeader from './index';
import { act } from 'react-test-renderer';

const defaultProps = {
  selectedThesaurus: { id: 1, lexicon_name: '名字', labels: ['111', '222', '333'] },
  knowledge: {},
  getThesaurusList: jest.fn(),
  setimportModalVisible: jest.fn(),
  setAddWordsVisible: jest.fn(),
  setOpWordsType: jest.fn()
};
const init = (props = defaultProps) => mount(<ThesaurusHeader {...props} />);

describe('ThesaurusHeader', () => {
  test('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('click function', () => {
  test('import', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.button .ad-mr-2').at(0).simulate('click');
    })
  })
})