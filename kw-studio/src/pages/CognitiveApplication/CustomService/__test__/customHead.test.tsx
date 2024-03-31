import React from 'react';
import { mount } from 'enzyme';
import CustomHead from '../CustomHead';
import { KnwItem } from '../types';
import { knData, INIT_STATE } from './mockData';

export interface CustomHeadProps {
  tableState: any;
  correlateGraph: any;
  onChange: () => void;
  knData: KnwItem;
}

const defaultProps: CustomHeadProps = {
  tableState: INIT_STATE,
  correlateGraph: [],
  onChange: jest.fn(),
  knData
};

const init = (props = defaultProps) => mount(<CustomHead {...props} />);
describe('test UI is render', () => {
  it('test exists', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
