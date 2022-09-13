import React from 'react';
import { mount } from 'enzyme';
import ThesaurusContent from './index';

const defaultProps = {
  selectedThesaurus: { id: 1 },
  getThesaurusById: jest.fn(),
  knowledge: {},
  getThesaurusList: jest.fn()
};
jest.mock('./ModelImport', () => (props = {}) => {
  const ModalImport: any = () => <div />;
  return <ModalImport className="modal-import-words" {...props} />;
});
jest.mock('./DeleteWords', () => (props = {}) => {
  const DeleteWordsModal: any = () => <div />;
  return <DeleteWordsModal className="words-delete-modal" {...props} />;
});

const init = (props = defaultProps) => mount(<ThesaurusContent {...props} />);

describe('ThesaurusContent', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
