import React from 'react';
import { shallow } from 'enzyme';
import ParamTable from '../paramTable';

const init = (props: any) => shallow(<ParamTable {...props} />);

describe('ParamTable', () => {
  it('component is exists', () => {
    const props = { tableData: [], type: 'aa' };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
