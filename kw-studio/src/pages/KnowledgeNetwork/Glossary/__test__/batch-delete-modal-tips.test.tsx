import React from 'react';
import { shallow } from 'enzyme';
import BatchDeleteModalTips from '../BatchDeleteModalTips/BatchDeleteModalTips';

const init = (props: any) => shallow(<BatchDeleteModalTips {...props} />);

describe('BatchDeleteModalTipsPage', () => {
  it('BatchDeleteModalTipsPage is exists', () => {
    const wrapper = init({
      closeBatchDeleteModalTips: () => {},
      columns: [],
      successDataCount: 0,
      failDataSource: []
    });
    expect(wrapper.exists()).toBe(true);
  });
});
