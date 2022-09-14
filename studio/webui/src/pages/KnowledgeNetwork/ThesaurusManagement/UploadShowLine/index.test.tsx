import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import UploadShowLine from './index';

const init = (props: any) => mount(<UploadShowLine {...props} />);

describe('UploadShowLine', () => {
  test('when value is empty', () => {
    const data = { value: [], onDeleteFile: () => {} };
    const wrapper = init(data);
    const text = wrapper.find('.placeholder').text();
    expect(text.includes(intl.get('knowledge.pleaseSelectFile'))).toBe(true);
  });

  test('when value is not empty class tag  is exists', () => {
    const data = { value: [{ uid: 'test', name: 'test' }], onDeleteFile: () => {} };
    const wrapper = init(data);
    expect(wrapper.find('.tag').exists()).toBe(true);
  });
});
