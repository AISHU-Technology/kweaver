import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import store from '@/reduxConfig/store';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import GraphList from '../index';

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn() })
}));
servicesKnowledgeNetwork.knowledgeNetGet = jest.fn(() =>
  Promise.resolve({
    res: {
      df: [
        {
          id: 1,
          color: '#126EE3',
          creation_time: '1971-01-01 00:00:00',
          creator_email: 'test@aishu.cn',
          creator_id: 'cde',
          creator_name: 'test',
          final_operator: 'bcd',
          identify_id: 'abc',
          knw_description: '',
          knw_name: 'test',
          operator_email: '--',
          operator_name: 'admin',
          update_time: '1971-01-01 00:00:00'
        }
      ],
      count: 20
    }
  })
);
servicesKnowledgeNetwork.knowledgeNetGetByName = jest.fn(() => Promise.resolve({ res: { df: [], count: 1 } }));

// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
const init = () => mount(<GraphList store={store} />);

describe('UI test', () => {
  it('should render', async () => {
    init();
    await sleep();
    expect(servicesKnowledgeNetwork.knowledgeNetGet).toBeCalled();
  });
});

describe('btn test', () => {
  it('sorters', async () => {
    const wrapper = init();
    await sleep();

    act(() => {
      wrapper.find('.ant-table-column-sorters').at(0).simulate('click');
    });
    await sleep();

    act(() => {
      wrapper.find('.ant-pagination-item').at(1).simulate('click');
    });
    await sleep();
  });
});
