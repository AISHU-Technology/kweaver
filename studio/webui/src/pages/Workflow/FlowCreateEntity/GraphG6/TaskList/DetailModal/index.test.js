import React from 'react';
import { shallow } from 'enzyme';
import DetailModal from './index';

const mockSelectedTask = {
  celery_task_id: '1',
  task_id: 1,
  task_name: 'name',
  task_status: 'finished',
  task_type: 'table'
};
jest.mock('@/services/createEntity', () => ({
  getEntityTasks: () =>
    Promise.resolve({
      res: {
        task_info: {
          tasks: [{ ...mockSelectedTask }],
          task_count: 1
        }
      }
    }),
  getTaskFiles: () =>
    Promise.resolve({
      res: {
        result: {
          create_time: '2022-00-00 00:00:00',
          create_user_email: '--',
          create_user_name: 'admin',
          error_code: '',
          file_numbers: 1,
          files: [['test']],
          finished_time: '2022-00-00 00:00:00',
          ontology_id: '6',
          task_id: 9,
          task_status: 'finished'
        }
      }
    })
}));

const defaultProps = {
  ontology_id: 1,
  page: 1,
  selectedTaskData: { ...mockSelectedTask },
  deleteTask: jest.fn()
};
describe('DetailModal', () => {
  it('test function', () => {
    const wrapperShallow = shallow(<DetailModal {...defaultProps} />);
    const instance = wrapperShallow.instance();
    expect(instance.changeTaskPage(1)).toBe();
    expect(instance.changeTaskInfoPage(1)).toBe();
    expect(instance.delete()).toBeTruthy();

    // test function getFileStatus
    expect(instance.getFileStatus('running')).toBeTruthy();
    expect(instance.getFileStatus('failed')).toBeTruthy();
    expect(instance.getFileStatus('finished')).toBeTruthy();
    expect(instance.getFileStatus()).toBeTruthy();
  });
});
