import React from 'react';
import { mount } from 'enzyme';
import ImportModel from '../ImportModel';

const init = (props: any) => mount(<ImportModel {...props} />);

describe('ImportModel', () => {
  it('component is exists', () => {
    const wrapper = init({
      knData: {},
      modelData: {},
      visible: true,
      onOk: () => {},
      onCancel: () => {},
      onChangeModelData: () => {}
    });
    expect(wrapper.exists()).toBe(true);
  });
});
