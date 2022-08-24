import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import serviceStorageManagement from '@/services/storageManagement';
import GraphListModal from '../graphListModal/index';

const props = {
  id: '1',
  visible: true,
  setVisible: jest.fn()
};

serviceStorageManagement.graphDBGetGraphById = jest.fn(() =>
  Promise.resolve({ res: { total: 4, data: [{ name: '123', time: '123' }] } })
);
const init = (props = {}) => mount(<GraphListModal {...props} />);

describe('ui test', () => {
  it('should render', async () => {
    init(props);
    await sleep();
  });
});
