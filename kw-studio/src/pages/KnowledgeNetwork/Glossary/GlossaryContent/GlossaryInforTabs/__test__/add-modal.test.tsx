import React from 'react';
import { shallow } from 'enzyme';
import AddModal from '../BasicInfo/AddModal';

const init = (props: any) => shallow(<AddModal {...props} />);

describe('AddModalPage', () => {
  it('AddModalPage is exists', () => {
    const props = {
      visible: true,
      editData: {},
      onCancel: () => {},
      refreshTerm: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
