import React from 'react';
import { mount } from 'enzyme';
import { sleep, act } from '@/tests';
import TableList from '.';

const defaultProps: any = {
  classPage: 1,
  dataList: {
    count: 2,
    result: [
      {
        tag: 'document',
        alias: 'document',
        color: '#8BC34A',
        vertexs: [
          {
            id: 'document-1',
            color: '#8BC34A',
            tags: ['document'],
            properties: {
              document: {
                create_time: '2022-11-22 16:00:17'
              }
            }
          },
          {
            id: 'document-2',
            color: '#8BC34A',
            tags: ['document'],
            properties: {
              document: {
                create_time: '2022-11-22 16:00:17'
              }
            }
          }
        ]
      }
    ]
  },
  searchConfig: [],
  checkData: ['1'],
  addedIds: ['3'],
  onPageChange: jest.fn(),
  setCheckData: jest.fn(),
  isSelectAdd: true
};

const init = (props = defaultProps) => mount(<TableList {...props} />);
describe('tableList', () => {
  it('render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
