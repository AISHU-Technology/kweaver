import React from 'react';
import { shallow, mount } from 'enzyme';
import store from '@/reduxConfig/store';
import { act, sleep } from '@/tests';
import DataBase from './index';

const init = (props = {}) => {
  const root = mount(<DataBase store={store} {...props} />);
  const wrapper = root.find('DataBase').at(0);

  return wrapper;
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<DataBase store={store} />);
  });
});

describe('function test', () => {
  const wrapper = init();
  const instance = wrapper.instance();

  test('test function basic', async () => {
    expect(instance.getTreeData()).toMatchObject({});

    expect(instance.getTreeData({ id: 1, data_source: 'test' })).toMatchObject({});

    expect(instance.getTreeDataF({ Code: 500001 })).toBe();

    expect(instance.getTreeDataF({ Code: 500002 })).toBe();

    expect(instance.getTreeDataF({ Code: 500006 })).toBe();

    expect(instance.getTreeDataF({ Code: 500009 })).toBe();

    expect(instance.getTreeDataF({ Code: 500013 })).toBe();

    act(() => {
      expect(instance.getTree(['test'])).toBe();
    });

    await sleep();

    expect(instance.onTreeCheck(['test'])).toBe();

    expect(instance.onSelect('test')).toMatchObject({});

    expect(instance.onSelectF({ Code: 500001 })).toBe();

    expect(instance.onSelectF({ Code: 500002 })).toBe();

    expect(instance.onSelectF({ Code: 500006 })).toBe();

    expect(instance.onSelectF({ Code: 500009 })).toBe();

    expect(instance.onSelectF({ Code: 500013 })).toBe();

    expect(instance.customizeRenderEmpty()).toBeTruthy();
  });

  test('test basic showDataType', () => {
    const wrapperT = init({ anyDataLang: 'zh-CN' });
    const instanceT = wrapperT.instance();

    expect(instanceT.showDataType('structured')).toBe('structured');

    expect(instanceT.showDataType('unstructured')).toBe('unstructured');

    expect(instance.showDataType('unstructured')).toBe('unstructured');
  });

  test('test basic dataSourceShow', () => {
    expect(instance.dataSourceShow('as')).toBe('AnyShare');
    expect(instance.dataSourceShow('mysql')).toBe('MySQL');
    expect(instance.dataSourceShow('hive')).toBe('Hive');
  });
});
