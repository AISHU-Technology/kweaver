import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import DeleteModal from '../deleteModal/index';

const props = {
  deleteModal: true,
  handleCancel: () => {},
  setOperationId: () => {},
  handleDeleteOk: () => {}
};

const init = (props = {}) => mount(<DeleteModal {...props} />);

describe('UI render', () => {
  it('render test', async () => {
    init(props);
    await sleep();
  });

  it('', () => {
    const wrapper = init(props);
    const btn = wrapper.find('Button');

    expect(btn.length).toBe(2);
  });
});
