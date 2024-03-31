import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import { UPLOAD_RECORD_STATUS } from '@/enums';
import RecordDetail from '../Content/RecordDetail';
import { mockUploadList } from './mockData';

const defaultProps = { loading: false, record: {}, onCancel: jest.fn(), onRefresh: jest.fn() };
const init = (props = defaultProps) => mount(<RecordDetail {...props} />);

describe('UploadRecordModal/Content/RecordDetail', () => {
  it('test render', async () => {
    const wrapper = init();

    const progress = mockUploadList.res.data.find(d => d.transferStatus === UPLOAD_RECORD_STATUS.PROGRESS);
    wrapper.setProps({ record: progress });
    expect(wrapper.find('.progress-steps').exists()).toBe(true);
  });
});
