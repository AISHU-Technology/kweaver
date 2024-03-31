import React from 'react';
import { shallow } from 'enzyme';
import moment from 'moment';
import TimedTaskConfig from './index';

const wrapperShallow = shallow(<TimedTaskConfig />);
const instance = wrapperShallow.instance();

jest.mock('@/services/timedTask', () => {
  return {
    createTask: () => {
      return {
        state: 'success'
      };
    },
    editTask: () => {
      return {
        state: 'success'
      };
    }
  };
});

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(<TimedTaskConfig />);
  });
});

describe('function test', () => {
  test('test function save by one', () => {
    instance.setState({ selectedTag: 'one', byTimeRef: { state: { selectTime: moment('01:01', 'HH:mm') } } });

    expect(instance.save()).toBeTruthy();
  });

  test('test function save by day', () => {
    instance.setState({ selectedTag: 'day', byDayRef: { state: { selectTime: moment('01:01', 'HH:mm') } } });

    expect(instance.save()).toBeTruthy();
  });

  test('test function save by week', () => {
    instance.setState({
      selectedTag: 'week',
      byWeekRef: { state: { runTime: moment('01:01', 'HH:mm'), selectWeek: [1, 2, 3] } }
    });

    expect(instance.save()).toBeTruthy();
  });

  test('test function save by month', () => {
    instance.setState({
      selectedTag: 'month',
      byMonthRef: { state: { runTime: moment('01:01', 'HH:mm'), selectedDay: [1, 2, 3, 4] } }
    });

    expect(instance.save()).toBeTruthy();
  });

  test('test function ref', () => {
    expect(instance.onByTimeRef('ref')).toBe();
    expect(instance.onByDayRef('ref')).toBe();
    expect(instance.onByWeekRef('ref')).toBe();
    expect(instance.onByMonthRef('ref')).toBe();
  });
});
