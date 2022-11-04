import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import { mockE } from './mockData';
import SumInfo from '../SumInfo';

const sumFunc = data => data.reduce((res, { count }) => res + parseInt(count), 0);
const init = (props = {}) => mount(<SumInfo {...props} />);

describe('SearchUI/SumInfo', () => {
  it('test render normal', async () => {
    const wrapper = init({ data: mockE });
    const inCounts = sumFunc(mockE.inE);
    const outCounts = sumFunc(mockE.outE);

    expect(wrapper.find('.coll-head .word').at(0).text().replace(/\D/g, '')).toBe(`${inCounts}`);
    expect(wrapper.find('.coll-head .word').at(1).text().replace(/\D/g, '')).toBe(`${outCounts}`);
  });
});
