import React from 'react';
import { shallow, mount } from 'enzyme';
import store from '@/reduxConfig/store';
import intl from 'react-intl-universal';
import AnyShare from './index';

const init = (props = {}) => {
  const root = mount(<AnyShare store={store} {...props} />);
  const wrapper = root.find('AnyShare').at(0);

  return wrapper;
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<AnyShare store={store} />);
  });
});

describe('function test', () => {
  const wrapper = init();
  const instance = wrapper.instance();

  test('test basic function', () => {
    expect(instance.getTreeData()).toMatchObject({});
  });

  test('test function getTreeDataF', () => {
    expect(instance.getTreeDataF({ Code: 500001 })).toBe();
    expect(instance.getTreeDataF({ Code: 500002 })).toBe();
    expect(instance.getTreeDataF({ Code: 500006 })).toBe();
    expect(instance.getTreeDataF({ Code: 500009 })).toBe();
    expect(instance.getTreeDataF({ Code: 500013 })).toBe();
  });

  test('test function createTree', () => {
    expect(
      instance.createTree(
        0,
        [{ docid: 'gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1', name: '123', type: 'dir' }],
        'treeName',
        undefined
      )
    ).toBeTruthy();
  });

  test('test basic onLoadData', () => {
    expect(
      instance.onLoadData({
        active: null,
        address: '123',
        checked: false,
        disableCheckbox: false,
        dragOver: false,
        dragOverGapBottom: false,
        dragOverGapTop: false,
        expanded: false,
        halfChecked: false,
        id: 'gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1',
        isLeaf: false,
        key: 'gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1',
        loaded: false,
        loading: false,
        name: '123',
        pId: 0,
        pos: '0-0',
        selectable: true
      })
    ).toMatchObject({});
  });

  test('test basic onLoadPreData', () => {
    expect(
      instance.onLoadPreData({
        active: null,
        address: '123',
        checked: false,
        disableCheckbox: false,
        dragOver: false,
        dragOverGapBottom: false,
        dragOverGapTop: false,
        expanded: false,
        halfChecked: false,
        id: 'gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1',
        isLeaf: false,
        key: 'gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1',
        loaded: false,
        loading: false,
        name: '123',
        pId: 0,
        pos: '0-0',
        selectable: true
      })
    ).toMatchObject({});
  });

  test('test basic onChange', () => {
    let wrapperT = init({
      selectedValue: {
        extract_type: 'labelExtraction'
      }
    });

    expect(wrapperT.instance().onChange('')).toBe();

    wrapperT = init({
      selectedValue: {
        extract_type: 'unstructured'
      }
    });

    expect(wrapperT.instance().onChange('')).toBe();

    expect(wrapper.instance().onChange('')).toBe();
  });

  test('test basic preDataSelected', () => {
    expect(instance.preDataSelected('test', { id: 1 })).toBe();
  });

  test('test basic getPreData', () => {
    expect(instance.getPreData(1)).toMatchObject({});
  });

  test('test basic getPreDataF', () => {
    expect(instance.getPreDataF({ Code: 500001 })).toBe();
    expect(instance.getPreDataF({ Code: 500002 })).toBe();
    expect(instance.getPreDataF({ Code: 500006 })).toBe();
    expect(instance.getPreDataF({ Code: 500009 })).toBe();
    expect(instance.getPreDataF({ Code: 500013 })).toBe();
  });

  test('test basic setPreSelect', () => {
    expect(
      instance.setPreSelect([{ docid: 'gns://A7BF3CFEB17F44AA8980E6D61F6EA9D1', name: '123', type: 'dir' }, 0, '123'])
    ).toBeTruthy();
  });

  test('test basic changeFileType', () => {
    expect(instance.changeFileType('csv')).toMatchObject({});
  });

  test('test basic dataSourceShow', () => {
    expect(instance.dataSourceShow('as')).toBe('AnyShare');
    expect(instance.dataSourceShow('as7')).toBe('AnyShare7');
    expect(instance.dataSourceShow('mysql')).toBe('MySQL');
    expect(instance.dataSourceShow('hive')).toBe('Hive');
  });

  test('test basic showDataType', () => {
    const wrapperT = init({ anyDataLang: 'zh-CN' });
    const instanceT = wrapperT.instance();

    expect(instanceT.showDataType('structured')).toBe('structured');

    expect(instanceT.showDataType('unstructured')).toBe('unstructured');

    expect(instance.showDataType('unstructured')).toBe('unstructured');
  });

  test('test basic showModelType', () => {
    expect(instance.showModelType('Generalmodel')).toContain(intl.get('createEntity.Gmodel'));
    expect(instance.showModelType('AImodel')).toContain(intl.get('createEntity.AImodel'));
  });

  test('test basic customizeRenderEmpty', () => {
    expect(instance.customizeRenderEmpty()).toBeTruthy();

    const wrapperT = init();
    const instanceT = wrapperT.instance();

    wrapperT.setState({
      fileTypeLoading: true
    });

    expect(instanceT.customizeRenderEmpty()).toBeTruthy();
  });
});
