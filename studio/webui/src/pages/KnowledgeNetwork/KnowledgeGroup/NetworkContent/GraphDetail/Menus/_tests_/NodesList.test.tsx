import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import NodesList from '../GraphInfo/SummaryInfo/NodesList';

const init = (props: any) => mount(<NodesList {...props} />);

describe('NodesList', () => {
  it('The props property items is empty ', () => {
    const props = { items: [] };
    const wrapper = init(props);

    const text = wrapper.find('.empty').text();
    expect(text.includes(intl.get('graphDetail.noContentPleaseConfiguration'))).toBe(true);
  });

  it('The props property items is not empty', () => {
    const props = { items: [{ name: 'test', count: 12, color: '#fff' }] };
    const wrapper = init(props);

    expect(wrapper.find('.ad-c-subtext').exists()).toBe(true);
  });
});
