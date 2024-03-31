import React from 'react';
import { mount } from 'enzyme';
import CustomService from '../index';
import { KnwItem } from '../types';
import { knData } from './mockData';

export interface ServiceListProps {
  knData: KnwItem;
}

const init = (props: ServiceListProps) => mount(<CustomService {...props} />);
describe('test UI is render', () => {
  it('test exists', () => {
    const wrapper = init({ knData });
    expect(wrapper.exists()).toBe(true);
  });
});
