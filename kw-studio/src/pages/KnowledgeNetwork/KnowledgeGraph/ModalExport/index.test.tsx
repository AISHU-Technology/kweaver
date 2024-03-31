import React from 'react';
import { mount } from 'enzyme';

import ModalExport from './index';

const init = (props: any) => mount(<ModalExport {...props} />);

describe('ModalExport', () => {
  it('class modalExportRoot is exists', () => {
    const data = { isVisible: true, knowledge: { id: 1 }, onClose: () => {} };
    const wrapper = init(data);
    expect(wrapper.find('.modalExportRoot').exists()).toBe(true);
  });
});
