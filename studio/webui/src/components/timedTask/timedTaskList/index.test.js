import React from 'react';
import { shallow } from 'enzyme';
import { setFrequency, setDetail, setType } from './assistFunction';
import TimedTaskList from './index';

jest.mock('@/services/timedTask', () => {
  return {
    timerGet: () => {
      return {
        count: 1,
        search: [
          {
            task_id: '2172ed06-5e2f-11ec-aedb-b07b2527ffc3',
            cycle: 'week',
            datetime: '16:40',
            date_list: [1, 2, 7],
            enabled: 1,
            update_user: 'admin',
            update_user_email: 'admin',
            create_time: '2021-12-16 13:10:20',
            modify_time: '2021-12-16 13:10:20',
            task_type: 'full'
          }
        ]
      };
    },
    timerGetInfo: () => {
      return {
        task_id: '2172ed06-5e2f-11ec-aedb-b07b2527ffc3',
        task_type: 'full',
        cycle: 'day',
        datetime: '2021-12-20 15:54',
        date_list: [],
        enabled: 1
      };
    },
    deleteTask: () => {
      return {
        state: 'success'
      };
    },
    timerSwitch: () => {
      return {
        state: 'success'
      };
    }
  };
});

const defaultProps = {
  graphId: 1,
  viewType: 'list',
  onCancel: jest.fn(),
  onOk: jest.fn(),
  changeViewType: jest.fn(),
  setAllTaskNumber: jest.fn(),
  setEditData: jest.fn()
};

describe('function test', () => {
  const wrapperShallow = shallow(<TimedTaskList {...defaultProps} />);
  const instance = wrapperShallow.instance();
  it('test function setSelectKey ', () => {
    expect(instance.setSelectKey(['1', '2', '3'])).toBe();
  });

  it('test function getTask', () => {
    expect(instance.getTask({ page: 1 })).toMatchObject({});
  });

  it('test function getEditTaskData', () => {
    expect(instance.getEditTaskData({ task_id: '1' })).toMatchObject({});
  });

  it('test function deleteTask', () => {
    expect(instance.deleteTask()).toMatchObject({});
  });

  it('test function deleteOneTask', () => {
    expect(instance.deleteOneTask()).toMatchObject({});
  });

  it('test function switchTaskStatus', () => {
    expect(instance.switchTaskStatus({ enabled: 1, task_id: '1' })).toMatchObject({});
  });
});

describe('assistFunction test', () => {
  it('test function setFrequency', () => {
    expect(setFrequency('one')).toBe('按次');
  });

  it('test function setFrequency', () => {
    expect(setFrequency('day')).toBe('按天');
  });

  it('test function setFrequency', () => {
    expect(setFrequency('week')).toBe('按周');
  });

  it('test function setFrequency', () => {
    expect(setFrequency('month')).toBe('按月');
  });

  it('test function setDetail', () => {
    expect(
      setDetail({
        task_id: '2172ed06-5e2f-11ec-aedb-b07b2527ffc3',
        cycle: 'one',
        datetime: '16:40',
        date_list: [],
        enabled: 1,
        update_user: 'admin',
        update_user_email: 'admin',
        create_time: '2021-12-16 13:10:20',
        modify_time: '2021-12-16 13:10:20',
        task_type: 'full'
      })
    ).toBeTruthy();
  });

  it('test function setDetail', () => {
    expect(
      setDetail({
        task_id: '2172ed06-5e2f-11ec-aedb-b07b2527ffc3',
        cycle: 'day',
        datetime: '16:40',
        date_list: [],
        enabled: 1,
        update_user: 'admin',
        update_user_email: 'admin',
        create_time: '2021-12-16 13:10:20',
        modify_time: '2021-12-16 13:10:20',
        task_type: 'full'
      })
    ).toBeTruthy();
  });

  it('test function setDetail', () => {
    expect(
      setDetail({
        task_id: '2172ed06-5e2f-11ec-aedb-b07b2527ffc3',
        cycle: 'week',
        datetime: '16:40',
        date_list: [1, 2, 7],
        enabled: 1,
        update_user: 'admin',
        update_user_email: 'admin',
        create_time: '2021-12-16 13:10:20',
        modify_time: '2021-12-16 13:10:20',
        task_type: 'full'
      })
    ).toBeTruthy();
  });

  it('test function setDetail', () => {
    expect(
      setDetail({
        task_id: '2172ed06-5e2f-11ec-aedb-b07b2527ffc3',
        cycle: 'month',
        datetime: '16:40',
        date_list: [1, 2, 7, 11, 21, 22, 31],
        enabled: 1,
        update_user: 'admin',
        update_user_email: 'admin',
        create_time: '2021-12-16 13:10:20',
        modify_time: '2021-12-16 13:10:20',
        task_type: 'full'
      })
    ).toBeTruthy();
  });

  it('test function setType', () => {
    expect(setType('full')).toBe('全量构建');
  });

  it('test function setType', () => {
    expect(setType('increment')).toBe('增量更新');
  });
});
