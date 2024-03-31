import React from 'react';
import { shallow } from 'enzyme';
import AddProperty from '../Property/AddProperty';

const init = (props: any) => shallow(<AddProperty {...props} />);

describe('AddPropertyPage', () => {
  it('AddPropertyPage is exists', () => {
    const props = {
      visible: true,
      onCancel: () => {},
      refreshTableData: () => {},
      listData: []
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
