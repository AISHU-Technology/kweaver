import React from 'react';
import { mount } from 'enzyme';
import Header from '../Header';

const init = (props: any) => mount(<Header {...props} />);

describe('Header', () => {
  it('component is exists', () => {
    const wrapper = init({
      sort: 'rule',
      knData: {},
      disabledOver: true,
      disabledImport: true,
      disabledDelete: true,
      onChangeSort: () => {},
      onDeleteBatch: () => {},
      onOpenCreateModel: () => {},
      onChangeFilter: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
