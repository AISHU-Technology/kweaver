import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import serviceStorageManagement from '@/services/storageManagement';
import GraphListModal from '../graphListModal/index';

const defaultProps = {
  id: 'id',
  visible: true,
  setVisible: jest.fn()
};

serviceStorageManagement.graphDBGetGraphById = jest.fn(() =>
  Promise.resolve({ res: { total: 1, data: [{ name: '123', created: '123' }] } })
);
const init = (props = defaultProps) => mount(<GraphListModal {...props} />);

describe('ui test', () => {
  it('should render', async () => {
    init();
    await sleep();
  });
});
