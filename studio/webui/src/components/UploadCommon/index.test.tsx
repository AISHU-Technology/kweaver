import React from 'react';
import { mount } from 'enzyme';
import UploadCommon from './index';

const init = (props: any) => mount(<UploadCommon {...props} />);

describe('PaginationCommon', () => {
  it('class ant-upload is exists', () => {
    const wrapper = init({});
    expect(wrapper.find('.ant-upload').exists()).toBe(true);
  });
});
