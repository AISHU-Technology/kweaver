import React from 'react';
import { mount } from 'enzyme';
import ModalBranchTask from './index';

const defaultProps = {
  visible: false,
  ontoId: 2,
  handleCancel: jest.fn(),
  goToTask: jest.fn(),
  graphId: 1
};

const init = (props = defaultProps) => mount(<ModalBranchTask {...props} />);

describe('ModalBranchTask', () => {
  it('class ModalBranchTask is exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
