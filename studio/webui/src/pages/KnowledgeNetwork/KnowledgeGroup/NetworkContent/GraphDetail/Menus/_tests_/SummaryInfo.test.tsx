import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import SummaryInfo from '../GraphInfo/SummaryInfo';

const init = (props: any) => mount(<SummaryInfo isShow={true} {...props} />);

describe('SummaryInfo', () => {
  it('The props property nodeCount and edgeCount is 0', () => {
    const props = { graphData: { nodes: [], edges: [] }, graphCount: { nodeCount: 0, edgeCount: 0 } };
    const wrapper = init(props);

    const text = wrapper.find('.empty').text();
    expect(text.includes(intl.get('graphDetail.noContentPleaseConfiguration'))).toBe(true);
  });

  it('The props property nodeCount and edgeCount is not 0', () => {
    const props = { graphData: { nodes: [], edges: [] }, graphCount: { nodeCount: 10, edgeCount: 10 } };
    const wrapper = init(props);

    expect(wrapper.find('.tabs').exists()).toBe(true);
    expect(wrapper.find('.tabsLabel').exists()).toBe(true);
  });
});
