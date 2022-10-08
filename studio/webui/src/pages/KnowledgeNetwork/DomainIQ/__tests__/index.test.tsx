import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import { mockIQList } from './mockData';
import DomainIQ from '../index';
import KnowledgeInfo from '../KnowledgeInfo';
import IQTable from '../IQTable';

KnowledgeInfo.displayName = 'KnowledgeInfo';
IQTable.displayName = 'IQTable';

jest.mock('@/services/intelligence', () => ({
  intelligenceGetByKnw: jest.fn(() => Promise.resolve(mockIQList))
}));
jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn() })
}));

import servicesIntelligence from '@/services/intelligence';

const mockResponse = (data: any) =>
  (servicesIntelligence.intelligenceGetByKnw as any).mockImplementationOnce(() => Promise.resolve(data));
const defaultProps = { kgData: { id: 1 } };
const init = (props = defaultProps) => mount(<DomainIQ {...props} />);

describe('DomainIQ', () => {
  it('test init', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    const { data } = wrapper.find('IQTable').props();
    expect(data).toEqual(mockIQList.res.graph_intelligence_list);
  });

  it('test edit', async () => {
    const wrapper = init();
    await sleep();
    mockResponse({
      res: {
        ...mockIQList.res,
        knw_name: '新的名称'
      }
    });
    (wrapper.find('KnowledgeInfo').invoke as any)('onEditSuccess')();
    await sleep();
    wrapper.update();
    const { kgInfo } = wrapper.find('KnowledgeInfo').props() as any;
    expect(kgInfo.knw_name).toBe('新的名称');
  });

  it('test change', async () => {
    const wrapper = init();
    await sleep();
    mockResponse({
      res: {
        ...mockIQList.res,
        total: 0,
        graph_intelligence_list: []
      }
    });
    wrapper.find('IQTable').invoke('onChange')!({ query: '搜索' } as any);
    await sleep();
    wrapper.update();
    const { data, tableState } = wrapper.find('IQTable').props() as any;
    expect(data).toEqual([]);
    expect(tableState.query).toBe('搜索');
  });
});
