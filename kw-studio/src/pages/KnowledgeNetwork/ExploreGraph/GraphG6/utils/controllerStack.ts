import _ from 'lodash';
import { changeVisible } from './';

class Stack {
  stack: any;
  name: string;
  onChange?: (value: any) => void;
  constructor(name: string) {
    this.stack = [];
    this.name = name;
  }
  set mount_onChange(fn: (value: any) => void) {
    this.onChange = fn;
  }
  getValue() {
    return this.stack;
  }
  _onChange(data: any) {
    if (!this.onChange) return;
    this.onChange(data);
  }
  push(stack: { action: string; data: any }) {
    const className = this.constructor.name;
    this._onChange({ class: className, name: this.name, type: 'push', ...stack });
    this.stack.unshift(stack);
  }
  pop() {
    const stack = this.stack.shift();
    const className = this.constructor.name;
    this._onChange({ class: className, name: this.name, type: 'pop', ...stack });
    return stack;
  }
  clear() {
    this.stack = [];
    const className = this.constructor.name;
    this._onChange({ class: className, name: this.name, type: 'clear' });
  }
}

class GraphStack {
  graph: any;
  undoStack: any;
  redoStack: any;
  constructor(graph?: any) {
    if (graph) this.graph = graph;
    this.undoStack = new Stack('undoStack');
    this.redoStack = new Stack('redoStack');
  }
  set mount_onChange(fn: (value: any) => void) {
    this.undoStack.mount_onChange = fn;
    this.redoStack.mount_onChange = fn;
  }
  pushStack(action: string, data: any, type?: string) {
    const stack = { action, data };
    if (type === 'redo') {
      this.redoStack.push(stack);
    } else {
      this.undoStack.push(stack);
    }
  }

  getStackData() {
    const undoStack = this.undoStack.getValue();
    const redoStack = this.redoStack.getValue();
    return { undoStack, redoStack };
  }

  getUndoStack() {
    return this.undoStack;
  }

  getRedoStack() {
    return this.redoStack;
  }

  clear() {
    this.undoStack.clear();
    this.redoStack.clear();
  }

  /**
   * 回退
   */
  onUndo(callback?: (data: any) => void) {
    if (!this.graph) return;

    const currentData: any = this.undoStack.pop();
    if (!currentData) return;

    const { action } = currentData;
    this.pushStack(action, _.cloneDeep(currentData.data), 'redo');
    const data = currentData.data.before;

    if (!data) return;

    const backData = { type: action, data: null };
    const graph = this.graph;
    switch (action) {
      case 'add':
        graph.clear();
        setTimeout(() => {
          if (data.newData) backData.data = data.newData;
          if (data.nodes) {
            data.nodes.forEach((model: any) => {
              const item = graph.addItem('node', model, false);
              if (model._sourceData?.isLock) item.lock();
            });
          }
          if (data.edges) {
            data.edges.forEach((model: any) => {
              graph.addItem('edge', model, false);
            });
          }
          graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
          if (callback) callback(backData);
        });
        break;
      case 'delete':
        graph.clear();
        setTimeout(() => {
          if (data.nodes) {
            data.nodes.forEach((model: any) => {
              const item = graph.addItem('node', model, false);
              if (model._sourceData?.isLock) item.lock();
            });
          }
          if (data.edges) {
            data.edges.forEach((model: any) => {
              graph.addItem('edge', model, false);
            });
          }
          graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
          if (callback) callback(backData);
        });
        break;
      case 'update':
        backData.data = data;
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach((model: any) => {
            const id = model.id;
            delete model.id;
            graph.updateItem(id, { ...model, _sourceData: model }, false);
            const item = graph.findById(id);
            if (item._cfg.type !== 'node') return;
            if (model._sourceData?.isLock) {
              item.lock();
            } else {
              item.unlock();
            }
          });
        });
        if (callback) callback(backData);
        break;
      case 'visible':
        backData.data = data;
        changeVisible(graph, data);
        if (callback) callback(backData);
        break;
      default:
        if (callback) callback(backData);
        break;
    }
  }
  /**
   * 重做
   */
  onRedo(callback?: (data: any) => void) {
    if (!this.graph) return;

    const currentData = this.redoStack.pop();
    if (!currentData) return;

    const { action } = currentData;
    this.pushStack(action, _.cloneDeep(currentData.data));
    let data = currentData.data.after;
    if (action === 'lock') data = currentData.data.before;
    if (!data) return;

    const backData = { type: action, data: null };
    const graph = this.graph;
    switch (action) {
      case 'add':
        graph.clear();
        setTimeout(() => {
          if (data.nodes) {
            data.nodes.forEach((model: any) => {
              const item = graph.addItem('node', model, false);
              if (model._sourceData?.isLock) item.lock();
            });
          }
          if (data.edges) {
            data.edges.forEach((model: any) => {
              if (!graph.findById(model.id)) graph.addItem('edge', model, false);
            });
          }
          graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
          if (callback) callback(backData);
        });
        break;
      case 'delete':
        graph.clear();
        setTimeout(() => {
          if (data.deleteData) backData.data = data.deleteData;
          if (data.nodes) {
            data.nodes.forEach((model: any) => {
              const item = graph.addItem('node', model, false);
              if (model._sourceData?.isLock) item.lock();
            });
          }
          if (data.edges) {
            data.edges.forEach((model: any) => {
              graph.addItem('edge', model, false);
            });
          }
          graph.fitView(0, { onlyOutOfViewPort: true, direction: 'y' });
          if (callback) callback(backData);
        });
        break;
      case 'update':
        backData.data = data;
        Object.keys(data).forEach(key => {
          const array = data[key];
          if (!array) return;
          array.forEach((model: any) => {
            const id = model.id;
            delete model.id;
            graph.updateItem(id, { ...model, _sourceData: model }, false);
            const item = graph.findById(id);
            if (item._cfg.type !== 'node') return;
            if (model._sourceData?.isLock) {
              item.lock();
            } else {
              item.unlock();
            }
          });
          if (callback) callback(backData);
        });
        break;
      case 'visible':
        backData.data = data;
        changeVisible(graph, data);
        if (callback) callback(backData);
        break;
      default:
        if (callback) callback(backData);
        break;
    }
  }
}

export default GraphStack;
