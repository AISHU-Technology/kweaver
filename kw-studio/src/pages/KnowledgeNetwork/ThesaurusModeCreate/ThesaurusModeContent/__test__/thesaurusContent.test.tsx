import React from 'react';
import { mount } from 'enzyme';
import ThesaurusContent from '../ThesaurusContent';
import { act } from '@/tests';

const defaultProps = {
  visible: false,
  setVisibleThesaurus: jest.fn(),
  thesaurusTableData: [],
  mode: 'custom',
  tabKey: 'thesaurus',
  setIsChange: jest.fn(),
  setThesaurusTableData: jest.fn(),
  setThesaurusTableDataTime: jest.fn(),
  tableLoading: false
};
const init = (props = defaultProps) => mount(<ThesaurusContent {...props} />);

describe('ThesaurusContent UI', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
