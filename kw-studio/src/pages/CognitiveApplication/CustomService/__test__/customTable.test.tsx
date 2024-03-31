import React from 'react';
import { mount } from 'enzyme';
import CustomTable from '../CustomTable';
import { KnwItem } from '../types';
import { act, triggerPropsFunc, sleep } from '@/tests';
import { knData, INIT_STATE, tableDataZero, tableDataOne, tableDataTwo } from './mockData';

jest.mock('@/services/customService', () => ({
  deleteCustomPublish: jest.fn(() => Promise.resolve({ res: 'ok' })),
  cancelCustomPublish: jest.fn(() => Promise.resolve({ res: 'ok' }))
}));

export interface CustomTableProps {
  tableState: any;
  correlateGraph: any;
  onChange: () => void;
  knData: KnwItem;
  tableData: any;
  sorter: any;
  setSorter: () => void;
  onEdit: () => void;
  setAuthData: () => void;
  onSetAuthData: () => void;
}

const defaultProps: CustomTableProps = {
  tableState: INIT_STATE,
  correlateGraph: [{ kg_id: '7', kg_name: 'test_1' }],
  onChange: jest.fn(),
  knData,
  tableData: [],
  sorter: { rule: 'edit_time', order: 'descend' },
  setSorter: jest.fn(),
  onEdit: jest.fn(),
  setAuthData: jest.fn(),
  onSetAuthData: jest.fn()
};

const init = (props = defaultProps) => mount(<CustomTable {...props} />);

describe('test UI', () => {
  it('test table', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
