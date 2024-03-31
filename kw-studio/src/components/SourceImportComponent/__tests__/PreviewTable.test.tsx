import React from 'react';
import { mount } from 'enzyme';
import { act, triggerPropsFunc } from '@/tests';
import PreviewTable from '../PreviewTable';
import Column from '../PreviewTable/Column';
import { mockTable } from './mockData';

(Column as any).displayName = 'Column';

const defaultProps = {
  data: mockTable,
  shouldCheck: true,
  checkedKeys: [],
  showLess: false,
  onCheck: jest.fn()
};
const init = (props = defaultProps) => mount(<PreviewTable {...props} />);

describe('/Preview/PreviewTable', () => {
  it('test', () => {
    const wrapper = init();
    triggerPropsFunc(wrapper.find('Column').first(), 'onCheck', true, 'key1');
    expect(wrapper.props().onCheck).toHaveBeenCalled();
  });
});

describe('/Preview/PreviewTable/Column', () => {
  it('test', async () => {
    const wrapper = mount(<Column {...defaultProps} data={mockTable[0]} isLast={false} checked={true} />);
    act(() => {
      wrapper.find('.p-th').simulate('click');
    });
    expect(wrapper.props().onCheck).toHaveBeenCalled();
    act(() => {
      wrapper.find('.drag-line').simulate('mousedown');
    });
  });
});
