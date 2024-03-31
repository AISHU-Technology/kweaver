import React from 'react';
import { mount } from 'enzyme';
import PaginationCommon from './index';

const init = (props: any) => mount(<PaginationCommon {...props} />);

describe('PaginationCommon', () => {
  it('class testClass is exists', () => {
    const wrapper = init({ className: 'testClass', paginationData: { page: 1, pageSize: 10, count: 12 } });
    expect(wrapper.find('.testClass').exists()).toBe(true);
  });
});
