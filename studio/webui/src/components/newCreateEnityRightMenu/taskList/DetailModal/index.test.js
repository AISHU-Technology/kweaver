import React from 'react';
import { shallow } from 'enzyme';
import DetailModal from './index';

const wrapperShallow = shallow(<DetailModal />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<DetailModal />);
  });
});

describe('function test', () => {
  test('test function componentDidMount', () => {
    const componentDidMountSpy = jest.spyOn(DetailModal.prototype, 'componentDidMount');

    shallow(<DetailModal />);
    expect(componentDidMountSpy).toHaveBeenCalled();

    componentDidMountSpy.mockRestore();
  });

  test('test function changePage', () => {
    expect(instance.changeTaskPage(1)).toBe();
    expect(instance.changeTaskInfoPage(1)).toBe();
  });

  test('test function delete', () => {
    expect(instance.delete()).toBeTruthy();
  });

  test('test function changePage', () => {
    const wrapperShallowSpy = shallow(<DetailModal />);

    wrapperShallowSpy.setState({
      taskInfo: {
        error_code: 500013
      }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();

    wrapperShallowSpy.setState({
      taskInfo: {
        error_code: 500002
      }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();

    wrapperShallowSpy.setState({
      taskInfo: {
        error_code: 500006
      }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();

    wrapperShallowSpy.setState({
      taskInfo: { error_code: 500009 }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();

    wrapperShallowSpy.setState({
      taskInfo: { error_code: 500001 }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();

    wrapperShallowSpy.setState({
      taskInfo: { task_status: 'running' }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();

    wrapperShallowSpy.setState({
      taskInfo: {
        create_email: '--',
        create_time: '2021-06-21 17:28:41',
        create_user: 'admin',
        error_code: '',
        file_numbers: 1,
        files: ['nei1.csv', '123/csv/nei1.csv', '249_结构化', 'success', 'csv'],
        finished_time: '2021-06-21 17:28:43',
        ontology_id: '24',
        task_id: 27,
        task_status: 'finished'
      }
    });

    expect(wrapperShallowSpy.instance().setShowType()).toBeTruthy();
  });

  test('test function getFileStatus', () => {
    expect(instance.getFileStatus('running')).toBeTruthy();
    expect(instance.getFileStatus('failed')).toBeTruthy();
    expect(instance.getFileStatus('finished')).toBeTruthy();
    expect(instance.getFileStatus()).toBeTruthy();
  });
});
