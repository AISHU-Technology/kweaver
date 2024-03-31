import React from 'react';
import { shallow } from 'enzyme';
import CustomRelationModal from '../CustomRelationModal';

const init = (props: any) => shallow(<CustomRelationModal {...props} />);

describe('CustomRelationModalPage', () => {
  it('CustomRelationModalPage is exists', () => {
    const wrapper = init({
      closeCustomRelationModal: () => {},
      visible: true
    });
    expect(wrapper.exists()).toBe(true);
  });
});
