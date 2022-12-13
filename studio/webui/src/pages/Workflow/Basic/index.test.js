import React from 'react';
import { mount } from 'enzyme';
import serviceWorkflow from '@/services/workflow';
import Basic from './index';
import { sleep } from '@/tests';

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn() })
}));

// serviceWorkflow.graphGetBis = jest.fn(() => Promise.resolve({ baseInfo_flag: false }));

const defaultProps = {
  basicData: {
    raphDBAddress: '10.4.131.25;10.4.131.18;10.4.133.125',
    graph_DBName: 'u1cfd2735fe7f11ec9bcfb618c8670cfd',
    graph_Name: '图谱名称',
    graph_db_id: 2,
    graph_des: '',
    graph_mongo_Name: 'mongoDB-33-33-33-33'
  }
};

describe('Workflow/Basic', () => {
  it('renders without crashing', async () => {
    mount(<Basic {...defaultProps} />);
    await sleep();
  });
});
