import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ConfigGraph, { ConfigGraphProps } from '../ConfigModal/ConfigGraph';

const defaultProps = { graphData: {} };
const init = (props: ConfigGraphProps = defaultProps) => mount(<ConfigGraph {...props} />);

describe('CognitiveSearch/ConfigGraph', () => {
  it('test event', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.move-wrap').simulate('click');
      wrapper.find('.add-icon').simulate('click');
      wrapper.find('.reduce-icon').simulate('click');
    });
  });
});
