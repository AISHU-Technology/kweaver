import React from 'react';
import { mount } from 'enzyme';
import ModelTable from '../ModelTable';

const init = (props: any) => mount(<ModelTable {...props} />);

describe('ModelTable', () => {
  it('component is exists', () => {
    const wrapper = init({
      sort: 'rule',
      items: [],
      filter: {},
      knData: {},
      coverId: 1,
      pagination: { page: 1, pageSize: 1, count: 1 },
      disabledImport: true,
      selectedRowKeys: [],
      onDelete: () => {},
      onChangeSort: () => {},
      onChangeAuthData: () => {},
      onChangeSelected: () => {},
      onOpenCreateModel: () => {},
      onChangePagination: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
