import React from 'react';
import { mount } from 'enzyme';
import NumberInput from './index';
import { act } from 'react-test-renderer';
import { sleep } from '@/tests';

const defaultProps = {
  defaultValue: 2,
  max: 100,
  min: 1
};

const init = (props: any) => mount(<NumberInput {...props}></NumberInput>);

describe('init wrapper', () => {
  it('render', () => {
    const onBlur = jest.fn(); // 失去焦点时调用的函数

    const wrapper = init({ ...defaultProps, onBlur });

    act(() => {
      wrapper
        .find('.ant-input-number-input')
        .at(0)
        .simulate('change', { target: { value: 23 } });
    });

    act(() => {
      wrapper.find('.ant-input-number-input').at(0).simulate('blur');
    });
  });
});
