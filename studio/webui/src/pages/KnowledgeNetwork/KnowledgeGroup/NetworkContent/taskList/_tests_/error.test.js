import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ErrorModal from '../errorModal/index';

const props = {
  errorModal: true,
  handleCancel: () => {},
  errorReport: {},
  setOperationId: 1
};

const init = (props = {}) => mount(<ErrorModal {...props} />);

describe('UI render', () => {
  it('render test', async () => {
    init(props);
    await sleep();
  });

  it('', () => {
    const wrapper = init(props);
    const btn = wrapper.find('Button');

    expect(btn.length).toBe(1);
  });
});
