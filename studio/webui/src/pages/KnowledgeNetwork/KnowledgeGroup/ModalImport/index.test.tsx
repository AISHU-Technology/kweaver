import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import ModalImport from './index';

const init = (props: any) => mount(<ModalImport {...props} />);

describe('ModalImport', () => {
  const data = {
    isVisible: true,
    isVisibleModalFeedback: false,
    onOk: () => {},
    onClose: () => {},
    closeModalFeedback: () => {}
  };
  test('class modalImportRoot is exists', () => {
    const wrapper = init(data);
    expect(wrapper.find('.modalImportRoot').exists()).toBe(true);
  });

  test('form have 3 children', () => {
    const wrapper = init(data);
    // console.log('测试看看', wrapper.find('.ant-form').children());
    expect(wrapper.find('#importForm').children()).toHaveLength(4);
  });
});
