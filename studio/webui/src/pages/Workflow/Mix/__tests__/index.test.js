import React from 'react';
import { shallow } from 'enzyme';
import Mix from '../index';

const defaultProps = {
  graphId: 1,
  graphName: '图谱名称',
  current: 5,
  dataSourceData: [{}],
  ontoData: [{ entity: [{}] }],
  infoExtrData: [{}],
  conflation: [{}],
  history: { push: jest.fn() },
  authLevel: 1,
  userInfo: { type: 0 },
  prev: jest.fn(),
  next: jest.fn(),
  setConflation: jest.fn(),
  getAuthLevel: () => 0
};
const init = (props = {}) => shallow(<Mix />);

describe('Mix', () => {
  it('test render', async () => {
    const wrapper = init();
  });
});
