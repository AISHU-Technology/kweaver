import React from 'react';
import { mount } from 'enzyme';
import ThesaurusModeModal from './index';
import { act } from '@/tests';

jest.mock('@/services/thesaurus', () => ({
  thesaurusList: () =>
    Promise.resolve({
      res: []
    })
}));

const defaultProps = {
  onHandleCancel: jest.fn(),
  editRecord: { thesaurus_id: 1, name: '词库', mode: 'std', description: '描述' },
  onHandleOk: jest.fn(),
  isChange: false,
  thesaurusTableData: [],
  tableData: []
};
const init = (props = defaultProps) => mount(<ThesaurusModeModal {...props} />);

describe('ThesaurusModeModal UI', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
