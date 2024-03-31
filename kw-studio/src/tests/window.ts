/**
 * 各种全局变量报错
 */

// antd报错， 全局定义 window.matchMedia
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn(query => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    }))
  });
}

// codemirror报错
if (!document.createRange) {
  (document as any).createRange = () => {
    return {
      setStart: jest.fn(),
      setEnd: jest.fn(),
      getBoundingClientRect: () => {
        return {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          toJSON: () => ({})
        };
      },
      getClientRects: () => [],
      createContextualFragment: jest.fn(),
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document
      }
    };
  };
}

// ResizeObserver 未定义
if (!global.ResizeObserver) {
  (global as any).ResizeObserver = class ResizeObserver {
    listener = jest.fn();
    constructor(ls?: any) {
      this.listener = ls;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

export {};
