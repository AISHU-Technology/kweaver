import React from 'react';
import { mount } from 'enzyme';
import ThesaurusTopColumn from '../ThesaurusTopColumn';
import { act } from '@/tests';

const defaultProps = {
  onExit: jest.fn(),
  editRecord: { thesaurus_id: 1, thesaurus_name: '分词' },
  setEditRecord: jest.fn(),
  mode: 'std',
  setIsChange: jest.fn(),
  isChange: false,
  tableData: [],
  thesaurusTableData: [],
  onGetInfoById: jest.fn()
};
const init = (props = defaultProps) => mount(<ThesaurusTopColumn {...props} />);

describe('ThesaurusTopColumn UI', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.kw-exit-bar')).toHaveLength(1);
  });
});

describe('ThesaurusTopColumn Function', () => {
  it('test render', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.kw-btn-text').at(0).simulate('click');
    });
  });
});
