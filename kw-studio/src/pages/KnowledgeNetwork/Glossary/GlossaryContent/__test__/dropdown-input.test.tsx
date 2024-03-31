import React from 'react';
import { shallow } from 'enzyme';
import DropdownInput from '../DropdownInput';

const init = (props: any) => shallow(<DropdownInput {...props} />);

describe('DropdownInputPage', () => {
  it('DropdownInputPage is exists', () => {
    const wrapper = init({
      errorInfo: '',
      initValue: '',
      existData: [],
      onBlur: () => {},
      onPressEnter: () => {},
      size: 'middle',
      onChange: () => {},
      onFocus: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
