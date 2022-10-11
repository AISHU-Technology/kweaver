import React from 'react';
import { shallow } from 'enzyme';
import SourceImport from './index';

const defaultProps = {
  graphId: 1,
  saveData: {},
  setSaveData: jest.fn(),
  openLoading: jest.fn(),
  closedLoading: jest.fn()
};
const init = (props = defaultProps) => shallow(<SourceImport {...props} />);

describe('function test', () => {
  it('test basic function', () => {
    const wrapper = init();
    const instance = wrapper.instance();
    expect(instance.getImage({ data_source: 'hive' })).toBeTruthy();
    expect(instance.getImage({ data_source: 'as7' })).toBeTruthy();
    expect(instance.getImage({ data_source: 'as' })).toBeTruthy();
    expect(instance.getImage({ data_source: 'mysql' })).toBeTruthy();
    expect(instance.customizeRenderEmpty()).toBeTruthy();
    expect(instance.isFlow()).toBe(false);
  });
});
