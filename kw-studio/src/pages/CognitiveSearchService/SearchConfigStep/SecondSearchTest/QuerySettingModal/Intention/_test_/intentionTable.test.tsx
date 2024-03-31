import React from 'react';
import IntentionTable from '../IntentionTable';
import { mount } from 'enzyme';
import { act } from '@/tests';

const defaultProps = {
  intentionList: [],
  isVisible: true
};
const init = (props = defaultProps) => mount(<IntentionTable {...props} />);

describe('test UI', () => {
  it('test table title', () => {
    const wrapper = init();
    const tableTitle = wrapper.find('.search-intention-slot-table-root').find('.ant-table-cell');
    expect(tableTitle.at(0).text()).toBe('序号');
    expect(tableTitle.at(1).text()).toBe('意图名称');
    expect(tableTitle.at(2).text()).toBe('槽位');
  });
  it('test none', () => {
    const wrapper = init({ ...defaultProps, isVisible: false });
    expect(wrapper.find('.intention-cognitive-modal-table').at(0).exists()).toBe(true);
  });
});
