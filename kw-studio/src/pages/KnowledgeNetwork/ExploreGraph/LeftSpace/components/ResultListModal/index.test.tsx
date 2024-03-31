import React from 'react';
import { mount } from 'enzyme';
import ResultModel from '.';

const defaultProps = {
  visible: true,
  searchType: 'vidSearch',
  resultData: {
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
              document: { ds_id: '3' }
            }
          }
        ]
      }
    ]
  },
  searchConfig: [],
  isSelectAdd: true,
  isDisabledJson: true,
  onClose: jest.fn(),
  getResult: jest.fn(),
  addData: jest.fn(),
  parameters: {}
};

const init = (props = defaultProps) => mount(<ResultModel {...props} />);

describe('render', () => {
  it('init render', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
