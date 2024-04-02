import React from 'react';
import { mount } from 'enzyme';
import { act, triggerPropsFunc } from '@/tests';
import TopSteps from '..';
import intl from 'react-intl-universal';
import _ from 'lodash';

const defaultProps = {
  step: 1,
  onExit: jest.fn(),
  isHideStep: false,
  title: ''
};

const titleList = [
  intl.get('cognitiveSearch.resource'),
  intl.get('cognitiveSearch.mode'),
  intl.get('cognitiveSearch.publishing')
];

const init = (props = defaultProps) => mount(<TopSteps {...props} />);

describe('test UI', () => {
  it('test btn', () => {
    const wrapper = init();
    expect(wrapper.find('Button').at(0).text()).toBe('退出');
  });
});

describe('test Function', () => {
  it('test btn click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('Button').at(0).simulate('click');
    });
  });
});