import React from 'react';
import { mount } from 'enzyme';
import ThesaurusManagemant from './index';

const defaultProps = { knData: { id: 1 } };
const init = (props = defaultProps) => mount(<ThesaurusManagemant {...props} />);

describe('ThesaurusManagemant', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
