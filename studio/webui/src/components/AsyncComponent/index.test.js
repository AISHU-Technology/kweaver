import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import asyncComponent from './index';

const MockComponent = () => <div />;
MockComponent.displayName = 'MockComponent';
const mockLazyImport = () => Promise.resolve(MockComponent);

describe('asyncComponent', () => {
  it('test load', async () => {
    const AsyncComponent = asyncComponent(mockLazyImport);
    const wrapper = mount(<AsyncComponent />);
    expect(wrapper.html()).toBeNull();
    await sleep();
    wrapper.update();
    expect(wrapper.find('MockComponent').exists()).toBe(true);
  });
});
