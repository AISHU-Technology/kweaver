import React from 'react';
import { mount } from 'enzyme';
import ThesaurusModeContent from '../index';

const defaultProps = { knwData: { id: 1 }, knwStudio: '', setKnwStudio: jest.fn() };
const init = (props = defaultProps) => mount(<ThesaurusModeContent {...props} />);

describe('ThesaurusManagemant', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
