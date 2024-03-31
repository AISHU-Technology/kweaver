import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import UploadingTable from './index';
import { mockUploadList } from '../../__tests__/mockData';

jest.mock('@/services/uploadKnowledge', () => ({
  taskGetRelationKN: () => Promise.resolve({ res: [{ id: 1, name: '知识网络' }] })
}));

const tableState = {
  loading: false,
  keyword: '',
  page: 1,
  total: mockUploadList.res.data.length,
  order: 'created',
  reverse: 1,
  kId: 0
};
const defaultProps = {
  pageSize: 6,
  tabsKey: 'uploading',
  data: mockUploadList.res.data,
  tableState,
  detailData: {},
  filterKgData: [],
  onChange: jest.fn(),
  onDetail: jest.fn()
};

const init = (props = defaultProps) => mount(<UploadingTable {...props} />);

describe('UploadingTable', () => {
  it('test render', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    expect(wrapper.find('.ant-table-row').length).toBe(mockUploadList.res.data.length);
  });
});
