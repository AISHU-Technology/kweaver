import React from 'react';
import { mount } from 'enzyme';

import CreateThesaurus from './index';

const defaultProps = {
  isVisible: true,
  knowledge: { id: 1 },
  closeModal: jest.fn(),
  getThesaurusList: jest.fn(),
  setPage: jest.fn()
};
const init = (props = defaultProps) => mount(<CreateThesaurus {...props} />);

describe('CreateThesaurus', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
