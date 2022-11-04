import React from 'react';
import { mount } from 'enzyme';

import store from '@/reduxConfig/store';
import Header from './index';

const PROPS = {
  userInfo: { type: 0 },
  ad_graphStatus: '',
  graphBasicData: {
    name: '1',
    status: 'normal',
    export: false,
    kg_conf_id: '11',
    is_upload: false,
    property_id: 1
  },
  selectedKnowledge: { id: 1 },
  onRefresh: () => {},
  onSelectedGraph: () => {},
  onRefreshLeftSpace: () => {}
};

const init = (props: any) => mount(<Header {...props} store={store} />);

jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn()
  })
}));

describe('Header', () => {
  it('test render', async () => {
    const wrapper = init(PROPS);
    const text = wrapper.find('.left').text();
    expect(text.includes(PROPS.graphBasicData.name)).toBe(true);
  });
});
