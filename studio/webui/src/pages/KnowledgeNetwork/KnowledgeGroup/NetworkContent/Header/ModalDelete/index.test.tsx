import React from 'react';
import { shallow } from 'enzyme';
import intl from 'react-intl-universal';

import ModalDelete from './index';

const init = (props: any) => shallow(<ModalDelete {...props} />);

const PROPS = {
  visible: true,
  onOk: () => {},
  onCancel: () => {}
};

describe('ModalDelete', () => {
  it('test render', async () => {
    const wrapper = init(PROPS);
    const text = wrapper.find('.title-text').text();
    expect(text.includes(intl.get('knowledge.deleteTitle'))).toBe(true);
  });
});
