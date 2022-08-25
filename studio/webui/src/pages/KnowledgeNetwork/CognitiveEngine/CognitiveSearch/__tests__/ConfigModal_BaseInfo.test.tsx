import React from 'react';
import { mount } from 'enzyme';
import store from '@/reduxConfig/store';
import BaseInfo from '../ConfigModal/BaseInfo';
import { mockEditData, mockGraphData } from './mockData';
import { convertData } from '../assistFunction';

const graphData = convertData(mockGraphData.res.df[0]);
const defaultProps = {
  data: mockEditData.res,
  graphData,
  configData: { nodeScope: ['A'], nodeRes: ['A'], edgeScope: [] }
};
const init = (props = defaultProps) => mount(<BaseInfo {...props} store={store} />);

describe('CognitiveSearch/ConfigModal/BaseInfo', () => {
  it('test render', () => {
    init();
  });
});
