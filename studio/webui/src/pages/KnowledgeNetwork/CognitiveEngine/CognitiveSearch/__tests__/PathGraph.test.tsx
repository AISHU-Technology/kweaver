import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import { mockResult } from './mockData';
import PathGraph, { PathGraphProps, handlePathData } from '../SearchResult/PathGraph';

const defaultProps = {
  graphData: {},
  markData: [],
  onSingleClick: jest.fn()
};
const init = (props: PathGraphProps = defaultProps) => mount(<PathGraph {...props} />);

describe('CognitiveSearch/PathGraph', () => {
  it('test change data', () => {
    const wrapper = init();
    const graphData = handlePathData(mockResult.res.search[0].search_path);
    wrapper.setProps({ graphData, markData: [mockResult.res.search[0].id] });
  });

  it('test event', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.move-wrap').simulate('click');
      wrapper.find('.add-icon').simulate('click');
      wrapper.find('.reduce-icon').simulate('click');
    });
  });
});
