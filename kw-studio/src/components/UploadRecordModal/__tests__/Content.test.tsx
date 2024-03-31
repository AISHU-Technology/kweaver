import React from 'react';
import { mount } from 'enzyme';
import Content from '../Content';

const defaultProps = { isIq: true };
const init = (props = defaultProps) => mount(<Content {...props} />);

describe('UploadRecordModal/Content', () => {
  it('test init', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
