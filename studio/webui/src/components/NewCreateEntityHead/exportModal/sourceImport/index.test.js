import React from 'react';
import { shallow } from 'enzyme';
import SourceImport from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<SourceImport />);
  });
});

describe('function test', () => {
  const wrapper = shallow(<SourceImport />);
  const instance = wrapper.instance();

  test('test basic function', () => {
    expect(instance.getImage({ data_source: 'hive' })).toBeTruthy();
    expect(instance.getImage({ data_source: 'as7' })).toBeTruthy();
    expect(instance.getImage({ data_source: 'as' })).toBeTruthy();
    expect(instance.getImage({ data_source: 'mysql' })).toBeTruthy();
    expect(instance.customizeRenderEmpty()).toBeTruthy();
    expect(instance.isFlow()).toBe(false);
  });

  test('test dsName', () => {
    const wrapper = shallow(<SourceImport />);

    wrapper.setState({
      dsName: [
        {
          dsname: 'test',
          ds_path: test
        }
      ]
    });

    shallow(<SourceImport />);
  });
});
