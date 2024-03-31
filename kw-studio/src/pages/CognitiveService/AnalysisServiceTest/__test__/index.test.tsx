import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import AnalysisServiceTest from '../index';
import store from '@/reduxConfig/store';
import { Provider } from 'react-redux';

const defaultProps = {
  operation_type: 'custom-search',
  serviceId: 12,
  sId: 1
};

jest.mock('@/services/analysisService', () => ({
  analysisServiceGet: Promise.resolve({ res: null })
}));

jest.mock('@/services/snapshotsService', () => ({
  snapshotsGetList: Promise.resolve({ res: { count: 0 } })
}));

jest.mock('@/services/visualAnalysis', () => ({
  vidRetrieval: Promise.resolve({ res: { nodes: [] } })
}));

const init = (props = defaultProps) =>
  mount(
    <Provider store={store}>
      <AnalysisServiceTest {...props} />
    </Provider>
  );

describe('AnalysisServiceTest/graphquery', () => {
  it('test', async () => {
    const wrapper = init();
    await sleep();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('AnalysisServiceTest/neighbor', () => {
  it('test', async () => {
    const wrapper = init({ ...defaultProps, operation_type: 'neighbors' });
    await sleep();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('AnalysisServiceTest/path', () => {
  it('test', async () => {
    const wrapper = init({ ...defaultProps, operation_type: 'shortest-path' });
    await sleep();
    expect(wrapper.exists()).toBe(true);
  });
});
