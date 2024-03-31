import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import ViewActuator from '../ViewActuator';
import templateJson from '../../../template.json';
import { exists } from 'fs';

const defaultProps = {
  onInsertText: jest.fn(),
  templateData: templateJson,
  addIsDisable: true,
  setAddIsDisable: jest.fn(),
  isDisableClick: false,
  setIsDisableClick: jest.fn()
};

const init = (props = defaultProps) => mount(<ViewActuator {...props} />);

describe('test UI', () => {
  it('UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
