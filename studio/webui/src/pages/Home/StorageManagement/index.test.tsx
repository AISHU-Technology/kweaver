import React from 'react';
import { mount } from 'enzyme';
import Storage from './index';
import { sleep } from '@/tests';
import { act } from 'react-test-renderer';

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '', listen: jest.fn() }),
  useHistory: () => ({ push: jest.fn(), location: { pathname: '' }, listen: jest.fn() })
}));

const init = (props: any) => mount(<Storage {...props} />);

describe('test', () => {
  it('render', async () => {
    const wrapper = init({});
    await sleep();
    wrapper.update();
    expect(wrapper.find('.storageManagementRoot').exists()).toBe(true);
  });
});
