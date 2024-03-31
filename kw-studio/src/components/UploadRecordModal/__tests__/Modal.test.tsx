import React from 'react';
import { shallow } from 'enzyme';
import { sleep } from '@/tests';
import UploadRecordModal from '../index';

const defaultProps = { visible: true, onCancel: jest.fn() };
const init = (props = defaultProps) => shallow(<UploadRecordModal {...props} />);

describe('UploadRecordModal', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
    await sleep();
  });
});
