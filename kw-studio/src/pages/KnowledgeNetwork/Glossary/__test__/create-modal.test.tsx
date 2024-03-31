import React from 'react';
import { shallow } from 'enzyme';
import CreateModal from '../CreateModal';

const init = (props: any) => shallow(<CreateModal {...props} />);

describe('CreateModalPage', () => {
  it('CreateModalPage is exists', () => {
    const props = {
      editData: {},
      onClose: () => {},
      kwId: 9,
      refreshTableData: () => {},
      openDetailPage: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
