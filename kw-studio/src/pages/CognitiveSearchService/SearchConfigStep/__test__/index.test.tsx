import React from 'react';
import { shallow } from 'enzyme';

import SearchConfigStep from '..';

const defaultProps = {
  knwData: {
    color: 'icon-color-zswl1',
    creation_time: '2023-12-10 23:15:29',
    creator_id: '1932e4ca-976e-11ee-856b-fa99f060fc32',
    creator_name: '魏旺',
    final_operator: '1932e4ca-976e-11ee-856b-fa99f060fc32',
    group_column: 0,
    id: 1,
    identify_id: 'f3f9d56e-976e-11ee-9121-eabbcf4debe4',
    intelligence_score: '51.02',
    knw_description: '111',
    knw_name: 'weiwang_test',
    operator_name: '魏旺',
    to_be_uploaded: 0,
    update_time: '2023-12-18 10:36:31'
  },
  knwStudio: '',
  setKnwStudio: jest.fn(),
  setIsClassifySetting: jest.fn(),
  isClassifySetting: false
};

const init = (props = defaultProps) => shallow(<SearchConfigStep {...props} />);

describe('test', () => {
  it('test exist', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
