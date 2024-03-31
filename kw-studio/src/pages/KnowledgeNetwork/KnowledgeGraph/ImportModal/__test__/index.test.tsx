import React from 'react';
import { mount } from 'enzyme';

import ImportModal from '..';
import { knData, modalFeedbackData } from './mock';

const defaultProps = {
  step: 0,
  visible: true,
  knowledge: knData,
  modalFeedbackData,
  setModalFeedbackData: jest.fn(),
  onClose: jest.fn(),
  fileData: [],
  setFileData: jest.fn(),
  btnContent: false,
  setBtnContent: jest.fn(),
  setFileReName: jest.fn(),
  fileReName: '',
  onNext: jest.fn(),
  onHandleClose: jest.fn(),
  knData,
  closeModalFeedback: jest.fn(),
  setIsVisibleImport: jest.fn(),
  onPrev: jest.fn(),
  setStep: jest.fn(),
  onTabSkip: jest.fn()
};

const init = (props = defaultProps) => mount(<ImportModal {...props} />);

describe('test', () => {
  it('test exist', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
