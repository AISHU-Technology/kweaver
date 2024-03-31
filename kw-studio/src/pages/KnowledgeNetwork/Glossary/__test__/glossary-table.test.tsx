import React from 'react';
import { shallow } from 'enzyme';
import GlossaryTable from '../GlossaryTable';

const init = (props: any) => shallow(<GlossaryTable {...props} />);

describe('GlossaryTablePage', () => {
  it('GlossaryTablePage is exists', () => {
    const props = {
      tableProps: {},
      pagination: {},
      knData: {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
