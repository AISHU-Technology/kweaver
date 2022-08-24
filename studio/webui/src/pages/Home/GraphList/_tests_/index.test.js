import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import store from '@/reduxConfig/store';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import GraphList from '../index';

servicesKnowledgeNetwork.knowledgeNetGet = jest.fn(() =>
  Promise.resolve({
    res: {
      df: [
        {
          knw_name: '123',
          operator_name: 'admin',
          operator_email: '--',
          update_time: '2022-07-01',
          creation_time: '2022-07-01'
        }
      ],
      count: 20
    }
  })
);
servicesKnowledgeNetwork.knowledgeNetGetByName = jest.fn(() => Promise.resolve({ res: { df: [], count: 1 } }));

const init = (props = {}) => mount(<GraphList {...props} store={store} />);

describe('UI test', () => {
  it('should render', async () => {
    const wrapper = init();

    // 无默认图谱id
    await sleep();
    expect(servicesKnowledgeNetwork.knowledgeNetGet).toBeCalled();
  });
});

describe('btn test', () => {
  it('sorters', async () => {
    const wrapper = init();

    await sleep();

    const u = wrapper.find('.ant-table-column-sorters');

    u.at(0).simulate('click');
    await sleep();
    u.at(1).simulate('click');

    const up = wrapper.find('.ant-pagination-item').at(1);

    up.at(0).simulate('click');
  });

  it('fun', async () => {
    const wrapper = init();
    const instance = wrapper.find('GraphList').at(0).instance();

    await sleep();
    wrapper.update();

    instance.openModalEdit({ id: 1, color: '#126EE3', knw_name: 'aaaa', knw_description: 'gggg' });
    instance.setCreateVisible(false);
    instance.openModalDel({ id: 1, color: '#126EE3' }, true);
    instance.onSearch();
    expect(servicesKnowledgeNetwork.knowledgeNetGetByName).toBeCalledTimes(0);
  });
});
