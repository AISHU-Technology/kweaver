import React from 'react';
import { shallow } from 'enzyme';
import EntityImport from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<EntityImport />);
  });
});

describe('function test', () => {
  const wrapperShallow = shallow(<EntityImport />);
  const instance = wrapperShallow.instance();

  test('test basic function', () => {
    expect(instance.getSelectData()).toMatchObject({});
    expect(instance.onChange('test')).toMatchObject({});
    expect(instance.customizeRenderEmpty()).toBeTruthy();
  });
});
