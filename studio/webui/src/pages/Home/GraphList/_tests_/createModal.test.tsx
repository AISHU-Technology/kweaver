import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import Created from '../createModal/index';

const defaultProps = {
  visible: true,
  source: {
    type: 'add',
    data: {}
  },
  onRefreshList: jest.fn(),
  onCloseCreateOrEdit: jest.fn()
};

servicesKnowledgeNetwork.knowledgeNetEdit = jest.fn(() => Promise.resolve({ res: 'success' }));
servicesKnowledgeNetwork.knowledgeNetCreate = jest.fn(() => Promise.resolve({ res: 'success' }));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn(), location: { pathname: '' }, listen: jest.fn() })
}));

const init = (props = defaultProps) => mount(<Created {...props} />);

describe('Function test', () => {
  it('ok btn click', async () => {
    const wrapper = init();

    await sleep();

    wrapper
      .find('.des-input')
      .at(0)
      .simulate('change', { target: { value: 'desc' } });
    wrapper
      .find('.auth-input')
      .at(0)
      .simulate('change', { target: { value: 'admin' } });

    await sleep();
    wrapper.update();

    wrapper.find('.btn.primary').at(0).simulate('click');
    await sleep();

    expect(servicesKnowledgeNetwork.knowledgeNetCreate).toHaveBeenCalled();
  });
});

describe('Function test', () => {
  it('edit', async () => {
    const wrapper = init({
      ...defaultProps,
      source: { type: 'edit', data: { knw_name: 'name', knw_des: 'desc', knw_color: '#126EE3' } }
    });

    await sleep();

    wrapper
      .find('.des-input')
      .at(0)
      .simulate('change', { target: { value: 'desc' } });
    wrapper
      .find('.auth-input')
      .at(0)
      .simulate('change', { target: { value: 'admin' } });

    await sleep();
    wrapper.update();

    wrapper.find('.btn.primary').at(0).simulate('click');
    await sleep();

    expect(servicesKnowledgeNetwork.knowledgeNetEdit).toHaveBeenCalled();
  });
});
