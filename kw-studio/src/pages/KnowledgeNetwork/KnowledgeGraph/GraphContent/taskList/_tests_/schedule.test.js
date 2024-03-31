import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ScheduleModal from '../scheduleModal/index';

const props = {
  scheduleModal: true,
  handleCancel: () => {},
  errorReport: {},
  setOperationId: 1,
  scheduleRefresh: () => {},
  scheduleData: {}
};

const init = (props = {}) => mount(<ScheduleModal {...props} />);

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
