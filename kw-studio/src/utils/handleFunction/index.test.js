import { mount } from 'enzyme';
import {
  getParam, // 获取url中的参数
  getPostfix, // 获取文件后缀
  wrapperTitle, // 截断title
  fuzzyMatch, // 模糊匹配
  switchIcon, // 根据文件后缀显示文件图标
  triggerEvent, // 手动触发事件
  localStore, // 对localStorage数据加一层url编码
  getScrollWidth,
  formatIQNumber
} from './index';
import * as isType from './isType';

describe('getParam', () => {
  it('should getParam', () => {
    expect(getParam('name')).toBe('');
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { search: '?name=名字' }
    });
    expect(getParam('name')).toBe('名字');

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { search: '?name=名字&id=5' }
    });
    expect(getParam(['name', 'id'])).toEqual({ name: '名字', id: '5' });
  });
});

describe('getPostfix', () => {
  it('should getPostfix', () => {
    expect(getPostfix(null)).toBe('');
    expect(getPostfix('没有后缀名的文件名称')).toBe('');
    expect(getPostfix('文本.txt')).toBe('txt');
    expect(getPostfix('文本.TXT')).toBe('txt');
    expect(getPostfix('文本.pdf.txt')).toBe('txt');
  });
});

describe('wrapperTitle', () => {
  it('should wrapperTitle', () => {
    expect(wrapperTitle(null)).toBe('');

    const text = new Array(31).fill(0).join('');
    const expectText = `${text.slice(0, 30)}\n${text.slice(30)}`;

    expect(wrapperTitle(text)).toBe(expectText);
  });
});

describe('', () => {
  it('should isType', () => {
    const { isString, isNumber, isBoolean, isFunction, isArray, isObject, isUndefined, isNull, isDef } = isType;

    expect(isString()).toBe(false);
    expect(isString('string')).toBe(true);

    expect(isNumber()).toBe(false);
    expect(isNumber(1)).toBe(true);

    expect(isBoolean()).toBe(false);
    expect(isBoolean(false)).toBe(true);

    expect(isFunction()).toBe(false);
    expect(isFunction(jest.fn())).toBe(true);

    expect(isArray()).toBe(false);
    expect(isArray([])).toBe(true);

    expect(isObject()).toBe(false);
    expect(isObject(null)).toBe(false);
    expect(isObject({})).toBe(true);

    expect(isUndefined(undefined)).toBe(true);
    expect(isUndefined('not undefined')).toBe(false);

    expect(isNull(null)).toBe(true);
    expect(isNull('not null')).toBe(false);

    expect(isDef(null)).toBe(false);
    expect(isDef(undefined)).toBe(false);
    expect(isDef(111)).toBe(true);
    expect(isDef(0)).toBe(true);
    expect(isDef(false)).toBe(true);
  });
});

describe('fuzzyMatch', () => {
  it('should fuzzyMatch', () => {
    expect(fuzzyMatch()).toBeFalsy();
    expect(fuzzyMatch('关键字', '一段文本')).toBeFalsy();
    expect(fuzzyMatch('关键字', '一段包含关键字的文本')).toBeTruthy();
  });
});

describe('triggerEvent', () => {
  it('should triggerEvent', () => {
    const mockClick = jest.fn();

    window.addEventListener('click', mockClick);
    triggerEvent('click');
    expect(mockClick).toHaveBeenCalled();
    window.removeEventListener('click', mockClick);

    document.fireEvent = jest.fn();
    triggerEvent('click', document);
    expect(document.fireEvent).toHaveBeenCalled();
  });
});

describe('localStore', () => {
  it('should localStore', () => {
    const key = 'userKey';
    const data = { name: 'user' };

    localStore.set(key, data);
    expect(window.localStorage.getItem(key)).toBeTruthy();
    expect(localStore.get(key)).toEqual(data);

    localStore.remove(key);
    expect(window.localStorage.getItem(key)).toBeNull();
  });
});

describe('switchIcon', () => {
  it('should switchIcon', () => {
    // 定义一个函数判断图标是否渲染
    const isRender = iconElement => !!mount(iconElement).find('svg').length;

    expect(isRender(switchIcon())).toBe(true); // 未知文件图标
    expect(isRender(switchIcon('dir'))).toBe(true);
    expect(isRender(switchIcon('sheet'))).toBe(true);

    const fileList = [
      'word文件.docx',
      'csv文件.csv',
      'json文件.json',
      'txt文件.txt',
      'excel文件.xlsx',
      'pdf文件.pdf',
      'ppt文件.pptx',
      'html文件.html',
      '视频文件.mp4',
      '音频文件.MP3',
      'ai文件.ai',
      '图片.jpg',
      'ps文件.ps',
      '压缩文件.zip',
      'cad文件.cad',
      '程序文件.exe',
      '数据库表.sql'
    ];

    fileList.forEach(file => {
      expect(isRender(switchIcon('file', file))).toBe(true);
    });
  });
});

describe('getScrollWidth', () => {
  it('test getScrollWidth', () => {
    const width = getScrollWidth();
    expect(typeof width).toBe('number');
  });
});

describe('formatIQNumber', () => {
  it('test formatIQNumber', () => {
    expect(formatIQNumber()).toBe('--');
    expect(formatIQNumber(-1)).toBe('--');
    expect(formatIQNumber('-1.00')).toBe('--');
    expect(formatIQNumber(1)).toBe('1');
    expect(formatIQNumber(1.2)).toBe('1.20');
    expect(formatIQNumber(1.23)).toBe('1.23');
    expect(formatIQNumber(1.234)).toBe('1.23');
    expect(formatIQNumber(1234.56)).toBe('1,234.56');
  });
});
