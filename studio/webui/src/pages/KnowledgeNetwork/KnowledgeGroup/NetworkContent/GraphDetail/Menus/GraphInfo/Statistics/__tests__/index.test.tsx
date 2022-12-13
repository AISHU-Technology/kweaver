import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import Statistics from '../index';
import ScoreCard from '../ScoreCard';
import { mockStatistics } from './mockData';

jest.mock('@/services/intelligence', () => ({
  intelligenceGetByGraph: jest.fn(() => Promise.resolve({ res: mockStatistics })),
  intelligenceCalculate: () => Promise.resolve({ res: 'success' })
}));

import servicesIntelligence from '@/services/intelligence';

ScoreCard.displayName = 'ScoreCard';
const mockServiceResponse = (data: any) =>
  (servicesIntelligence.intelligenceGetByGraph as any).mockImplementationOnce(() => Promise.resolve(data));
const graphBasicData = { id: 1, status: 'normal', graphdb_type: 'nebule' };
const graphCount = { nodes: [{ count: 1 }], edges: [{ count: 1 }], nodeCount: 1, edgeCount: 1 };
const defaultProps = { isShow: true, graphBasicData, graphCount };
const init = (props = defaultProps) => mount(<Statistics {...props} />);

describe('Statistics', () => {
  it('test init', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    const { score } = wrapper.find('ScoreCard').at(0).props() as any;
    expect(score).toBe(mockStatistics.data_quality_B);
  });

  it('test calculate failed', async () => {
    const wrapper = init();
    await sleep();
    mockServiceResponse({
      ErrorCode: 'failed',
      Description: 'failed',
      res: { calculate_status: 'CALCULATE_FAIL', last_task_message: 'failed' }
    });

    act(() => {
      wrapper.find('.compute-btn').simulate('click');
    });
    await sleep();
    wrapper.update();

    expect(wrapper.find('.error-tip .error-text').text()).toBe('failed');

    act(() => {
      wrapper.find('.error-tip .close-icon').first().simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.error-tip').exists()).toBe(false);
  });
});
