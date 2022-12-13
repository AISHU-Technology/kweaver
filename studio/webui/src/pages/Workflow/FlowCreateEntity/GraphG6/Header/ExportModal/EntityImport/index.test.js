import React from 'react';
import { shallow } from 'enzyme';
import EntityImport from './index';

jest.mock('@/services/createEntity', () => ({
  getAllNoumenon: () => Promise.resolve({ res: { df: [] } }),
  getAllNoumenonData: () =>
    Promise.resolve({
      res: {
        df: [
          {
            all_task: '[]',
            create_time: '2022-09-18 16:54:00',
            create_user: '853ba1db-4e37-11eb-a57d-0242ac190002',
            edge: [],
            entity: [],
            id: 30,
            ontology_des: '',
            ontology_name: 'test',
            otl_status: 'available',
            update_time: '2022-09-18 17:13:08',
            update_user: '853ba1db-4e37-11eb-a57d-0242ac190002',
            used_task: '[]'
          }
        ]
      }
    })
}));

describe('exportModal/entityImport', () => {
  it('test basic function', () => {
    const props = {
      saveData: {},
      setSaveData: jest.fn(),
      openLoading: jest.fn(),
      closedLoading: jest.fn()
    };
    shallow(<EntityImport {...props} />);
  });
});
