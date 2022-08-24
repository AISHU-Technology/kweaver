import React from 'react';
import { mount } from 'enzyme';
import { sleep } from '@/tests';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import Created from '../createModal/index';

const props = {
  visible: true,
  setVisible: jest.fn(),
  optionType: 'add',
  editNetwork: {},
  getData: jest.fn()
};

servicesKnowledgeNetwork.knowledgeNetEdit = jest.fn(() => Promise.resolve({ res: 'success' }));
servicesKnowledgeNetwork.knowledgeNetCreate = jest.fn(() => Promise.resolve({ res: 'success' }));

jest.mock('react-router-dom', () => ({
  useHistory: () => ({ push: jest.fn(), location: { pathname: '' }, listen: jest.fn() })
}));

const init = (props = {}) => mount(<Created {...props} />);

describe('Function test', () => {
  it('ok btn click', async () => {
    const wrapper = init(props);

    await sleep();

    wrapper
      .find('.des-input')
      .at(0)
      .simulate('change', { target: { value: 'ygname' } });
    wrapper
      .find('.auth-input')
      .at(0)
      .simulate('change', { target: { value: 'admin' } });
    // wrapper.find('.box').at(2).simulate('click');

    await sleep();
    wrapper.update();

    wrapper.find('.btn.primary').at(0).simulate('click');
    await sleep();

    expect(servicesKnowledgeNetwork.knowledgeNetCreate).toHaveBeenCalled();
  });
});

describe('Function test', () => {
  it('edit', async () => {
    const wrapper = init({ ...props, optionType: 'edit' });

    await sleep();

    wrapper
      .find('.des-input')
      .at(0)
      .simulate('change', { target: { value: 'yame' } });
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
