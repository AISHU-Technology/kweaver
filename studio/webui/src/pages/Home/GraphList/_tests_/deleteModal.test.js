import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import DeleteModal from '../deleteModal/index';

const props = {
  visible: true,
  setVisible: jest.fn(),
  getData: jest.fn(),
  delId: 1
};

servicesKnowledgeNetwork.knowledgeNetDelete = jest.fn(() => Promise.resolve({ res: 'success' }));
const init = (props = {}) => mount(<DeleteModal {...props} />);

describe('UI render', () => {
  it('render test', async () => {
    init(props);
    await sleep();
  });

  it('', () => {
    const wrapper = init(props);
    const btn = wrapper.find('Button');

    expect(btn.length).toBe(2);
  });
});

describe('Function', () => {
  it('ok btn', async () => {
    const wrapper = init(props);

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();

    expect(servicesKnowledgeNetwork.knowledgeNetDelete).toHaveBeenCalled();
    expect(props.getData).toHaveBeenCalled();
  });

  it('cancel btn', async () => {
    const wrapper = init(props);

    const cancel = wrapper.find('.ant-btn-default .delete-cancel').at(0);

    act(() => {
      cancel.simulate('click');
    });
    await sleep();

    expect(props.setVisible).toHaveBeenCalled();
  });
});

describe('error text', () => {
  it('error', async () => {
    servicesKnowledgeNetwork.knowledgeNetDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Builder.service.knw_service.knwService.deleteKnw.GraphNotEmptyError' })
    );
    const wrapper = init(props);

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });

  it('PermissionError', async () => {
    servicesKnowledgeNetwork.knowledgeNetDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Builder.service.knw_service.knwService.deleteKnw.PermissionError' })
    );
    const wrapper = init(props);

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });

  it('RequestError', async () => {
    servicesKnowledgeNetwork.knowledgeNetDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Builder.service.knw_service.knwService.deleteKnw.RequestError' })
    );
    const wrapper = init(props);

    const ok = wrapper.find('.delete-ok').at(0);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });
});
