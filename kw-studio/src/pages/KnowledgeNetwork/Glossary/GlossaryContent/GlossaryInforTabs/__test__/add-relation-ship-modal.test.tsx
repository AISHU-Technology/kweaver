import React from 'react';
import { shallow } from 'enzyme';
import AddRelationShipModal from '../RelationShips/addRelationShipModal';

const init = (props: any) => shallow(<AddRelationShipModal {...props} />);

describe('AddRelationShipModalPage', () => {
  it('AddRelationShipModalPage is exists', () => {
    const props = {
      visible: true,
      onCancel: () => {},
      refreshTableData: () => {},
      listData: [],
      editData: {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
