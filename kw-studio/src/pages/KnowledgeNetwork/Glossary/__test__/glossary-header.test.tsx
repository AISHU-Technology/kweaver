import React from 'react';
import { shallow } from 'enzyme';
import Header from '../Header';

const init = (props: any) => shallow(<Header {...props} />);

describe('GlossaryHeaderPage', () => {
  it('GlossaryHeaderPage is exists', () => {
    const props = {
      order: '',
      orderField: '',
      delDisabled: false,
      onSortChange: () => {},
      openCreateModal: () => {},
      openDeleteModal: () => {},
      refreshTableData: () => {},
      knData: {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
