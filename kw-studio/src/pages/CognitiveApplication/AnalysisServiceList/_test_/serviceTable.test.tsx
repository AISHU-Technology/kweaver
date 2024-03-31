import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import ServiceTable from '../ServiceTable';
import { ListItem, TableState, kgData } from '../types';
import { tableData, kgNames } from './mockData';
import { INIT_STATE } from '../enum';

jest.mock('@/services/analysisService', () => ({
  analysisServiceList: jest.fn(() => Promise.resolve({})),
  analysisServiceCancel: jest.fn(() => Promise.resolve({}))
}));
export interface ServiceTableType {
  data: any[];
  tableState: TableState;
  onChange: (state: Partial<TableState>) => void;
  onCreate: () => void;
  onEdit?: (data: ListItem, type: string) => void;
  correlateGraph: kgData[];
  isDrawer: boolean;
  setIsDrawer: (state: any) => void;
  setAuthData: (data: any) => void;
}
const defaultProps: ServiceTableType = {
  data: tableData,
  tableState: INIT_STATE,
  onChange: jest.fn(),
  onCreate: jest.fn(),
  onEdit: jest.fn(),
  correlateGraph: kgNames,
  isDrawer: true,
  setIsDrawer: jest.fn(),
  setAuthData: jest.fn()
};

const init = (props = defaultProps) => mount(<ServiceTable {...props} />);
describe('test UI is render', () => {
  it('test head', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
