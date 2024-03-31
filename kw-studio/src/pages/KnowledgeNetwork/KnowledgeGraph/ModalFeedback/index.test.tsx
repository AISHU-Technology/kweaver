import React from 'react';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import ModalFeedback from './index';

const init = (props: any) => mount(<ModalFeedback {...props} />);

describe('ModalFeedback', () => {
  test('when type is loading subTitle is waitPatiently', () => {
    const data = { isVisible: true, data: { type: 'loading', fileCount: 2 }, onCancel: () => {} };
    const wrapper = init(data);
    const text = wrapper.find('.subTitle').text();
    expect(text.includes(intl.get('knowledge.waitPatiently', { fileCount: 2 }))).toBe(true);
  });

  test('when type is success subTitle is countImportSuccess', () => {
    const data = { isVisible: true, data: { type: 'success', fileCount: 2 }, onCancel: () => {} };
    const wrapper = init(data);
    const text = wrapper.find('.subTitle').text();
    expect(text.includes(intl.get('knowledge.countImportSuccess', { fileCount: 2 }))).toBe(true);
  });

  test('when type is fail subTitle is importExceptions', () => {
    const data = { isVisible: true, data: { type: 'fail', fileCount: 2 }, onCancel: () => {} };
    const wrapper = init(data);
    const text = wrapper.find('.subTitle').text();
    expect(text.includes(intl.get('license.operationFailed'))).toBe(true);
  });

  test('when type is failNotEnoughSpace subTitle is insufficientSpace', () => {
    const data = { isVisible: true, data: { type: 'failNotEnoughSpace', fileCount: 2 }, onCancel: () => {} };
    const wrapper = init(data);
    const text = wrapper.find('.subTitle').text();
    expect(text.includes(intl.get('knowledge.insufficientSpace'))).toBe(true);
  });
});
