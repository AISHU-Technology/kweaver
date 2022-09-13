import React from 'react';
import { shallow } from 'enzyme';
import TaskList from './index';
import { getFileType, analyUrl } from './assistFunction';

const props = {
  taskListData: [
    {
      celery_task_id: '441860ca-a5e6-44e9-b063-0812ef20ad4a',
      task_id: 11,
      task_name: 'Task1',
      task_status: 'finished',
      task_type: 'multi-files'
    }
  ],
  nodes: [
    {
      colour: '#805A9C',
      dataType: 'structured',
      data_source: 'as7',
      ds_address: 'https://10.2.174.249',
      ds_id: 2,
      ds_name: '249_结构化',
      ds_path: '123',
      entity_id: 7,
      extract_type: 'standardExtraction',
      file_type: 'csv',
      index: 0,
      model: '',
      name: 'nei1',
      source_type: 'automatic',
      task_id: 22
    }
  ],
  edges: [],
  selectedElement: '',
  used_task: [22]
};

const wrapperShallow = shallow(<TaskList {...props} />);
const instance = wrapperShallow.instance();

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<TaskList />);
  });

  it('renders without crashing', () => {
    shallow(<TaskList {...props} />);
  });
});

describe('function test', () => {
  test('test function componentDidMount', () => {
    const componentDidMountSpy = jest.spyOn(TaskList.prototype, 'componentDidMount');

    shallow(<TaskList />);
    expect(componentDidMountSpy).toHaveBeenCalled();

    componentDidMountSpy.mockRestore();
  });

  test('test function componentWillUnmountSpy', () => {
    const componentWillUnmountSpy = jest.spyOn(TaskList.prototype, 'componentWillUnmount');

    shallow(<TaskList />);
    expect(componentWillUnmountSpy).toBeTruthy();

    componentWillUnmountSpy.mockRestore();
  });

  test('test function intervalUpdateData', () => {
    expect(instance.intervalUpdateData(1, [])).toBe();
  });

  test('test function intervalUpdateData', () => {
    expect(instance.intervalUpdateData(1, [])).toBe();
  });

  test('test function changePage', () => {
    expect(instance.changePage(1)).toBe();
  });

  test('test function deleteTask', async () => {
    await expect(
      instance.deleteTask({
        celery_task_id: '338c9ba6-e7de-4a5d-bc34-5eeec3304051',
        task_id: 22,
        task_name: 'nei1.csv',
        task_status: 'finished',
        task_type: 'csv'
      })
    ).toMatchObject({});
  });

  test('test function changePage', () => {
    expect(
      instance.deleteHandle({
        celery_task_id: '338c9ba6-e7de-4a5d-bc34-5eeec3304051',
        task_id: 22,
        task_name: 'nei1.csv',
        task_status: 'finished',
        task_type: 'csv'
      })
    ).toBe();
  });
});

describe('assistFunction test', () => {
  test('test function getFileType', () => {
    expect(getFileType('table')).toBe('DataSheet.svg');
    expect(getFileType('files')).toBe('Folder-blue.svg');
    expect(getFileType('json')).toBe('json.svg');
    expect(getFileType('csv')).toBe('csv.svg');
    expect(getFileType('multi-files')).toBe('Folder-blue.svg');
    expect(getFileType('mysql')).toBe('DataSheet.svg');
    expect(getFileType('hive')).toBe('DataSheet.svg');
  });

  test('test function analyUrl', () => {
    expect(analyUrl('')).toEqual({ name: '', type: '' });
    expect(analyUrl('/new-create-entity?ontology_id=21&type=edit')).toEqual({
      name: 'ntity?ontology_id=21',
      type: 'edit'
    });
  });
});
