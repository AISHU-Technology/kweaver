import React from 'react';
import { shallow, mount } from 'enzyme';
import { BrowserRouter } from 'react-router-dom';
import EditEntityModal from './index';

const init = (props = {}) => {
  const root = mount(
    <BrowserRouter>
      <EditEntityModal {...props} />
    </BrowserRouter>
  );
  const wrapper = root.find('EditEntityModal').at(0);

  return wrapper;
};

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<EditEntityModal />);
  });
});

describe('function test', () => {
  const wrapperShallow = init();
  const instance = wrapperShallow.instance();

  test('test function addEntityT', () => {
    expect(instance.addEntityT({ res: { ontology_id: 1 } }, {})).toBe();
  });

  test('test function addEntityF', () => {
    expect(instance.addEntityF()).toBe();
  });

  test('test function changeEntityT', () => {
    expect(instance.changeEntityT({ ontology_name: 'tt', ontology_des: '' })).toBe();
  });

  test('test function flowHanle', () => {
    const wrapperShallow = init();
    const instance = wrapperShallow.instance();

    expect(instance.flowHanle({ ontology_name: 'tt', ontology_des: '' })).toBe();

    const wrapperShallowT = init({ props: { ontology_id: 1 } });
    const instanceT = wrapperShallowT.instance();

    expect(instanceT.flowHanle({ ontology_name: 'tt', ontology_des: '' })).toBe();
  });

  test('test input change', () => {
    const desInput = wrapperShallow.find('.des-input');
    const entityInput = wrapperShallow.find('.entity-input');

    entityInput.forEach((item, index) => {
      item.simulate('change', { target: { value: 'des' } });
    });

    desInput.forEach((item, index) => {
      item.simulate('change', { target: { value: 'name' } });
    });

    desInput.forEach((item, index) => {
      item.simulate('change', { target: { value: '' } });
    });

    desInput.forEach((item, index) => {
      item.simulate('change', {
        target: {
          value:
            'testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50'
        }
      });
    });

    desInput.forEach((item, index) => {
      item.simulate('change', { target: { value: '#' } });
    });

    wrapperShallow.find('input#entityname').simulate('change', {
      target: {
        value:
          'testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50testmore50'
      }
    });

    wrapperShallow.find('input#entityname').simulate('change', {
      target: {
        value: '#'
      }
    });

    wrapperShallow.find('input#entityname').simulate('change', {
      target: {
        value: ''
      }
    });
  });

  test('test function onFinish', () => {
    const wrapperShallowT = init({ ontology_id: 1 });
    const instanceT = wrapperShallowT.instance();

    expect(instance.onFinish({})).toBe();
    expect(instanceT.onFinish({})).toBe();
  });

  test('test function addEntity', () => {
    expect(instance.addEntity({})).toMatchObject({});
  });

  test('test function changeEntity', () => {
    expect(instance.changeEntity({}, 1)).toMatchObject({});
  });
});
