import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import BasicInfo from '../GraphInfo/BasicInfo';

const init = (props: any) => mount(<BasicInfo isShow={true} {...props} />);

describe('BasicInfo', () => {
  const props = {
    ad_graphStatus: 'stop',
    onRefresh: () => {},
    graphCount: { nodeCount: 10, edgeCount: 10 },
    graphBasicData: {
      name: 'AStoken通道测试1',
      status: 'stop',
      graph_des: '测试',
      is_import: false,
      create_time: '2022-06-20 15:59:10',
      create_user: 'admin',
      update_user: 'admin',
      update_time: '2022-07-06 16:48:09',
      graphdb_name: 'u8bef91aa064311edb42d6a0b7ec00819'
    }
  };
  it('have name', () => {
    const wrapper = init(props);
    expect(wrapper.find('.content').exists()).toBe(true);
  });

  it('class graphStatus exists', () => {
    const wrapper = init(props);
    expect(wrapper.find('.graphStatus').exists()).toBe(true);
  });
});
