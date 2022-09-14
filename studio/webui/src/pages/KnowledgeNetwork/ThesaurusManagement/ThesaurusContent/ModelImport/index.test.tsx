import React from 'react';
import { shallow } from 'enzyme';
import ThesaurusImport from './index';

const defaultProps = {
  selectedThesaurus: { id: 1 },
  getThesaurusById: jest.fn(),
  isVisible: true,
  closeModal: jest.fn()
};
const init = (props = defaultProps) => shallow(<ThesaurusImport {...props} />);

describe('ThesaurusContent', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
