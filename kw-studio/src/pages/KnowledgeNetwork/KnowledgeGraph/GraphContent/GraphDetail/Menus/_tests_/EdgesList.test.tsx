import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import EdgesList from '../GraphInfo/SummaryInfo/EdgesList';

const init = (props: any) => mount(<EdgesList {...props} />);

describe('EdgesList', () => {
  it('The props property items is empty', () => {
    const props = { items: [] };
    const wrapper = init(props);

    const text = wrapper.find('.empty').text();
    expect(text.includes(intl.get('graphDetail.noContent'))).toBe(true);
  });

  it('The props property items is not empty', () => {
    const props = { items: [{ alias: 'test', count: 12, color: '#fff' }] };
    const wrapper = init(props);

    expect(wrapper.find('.kw-c-subtext').exists()).toBe(true);
  });
});
