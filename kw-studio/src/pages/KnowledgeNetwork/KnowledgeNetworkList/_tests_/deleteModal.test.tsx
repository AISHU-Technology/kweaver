import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import servicesKnowledgeNetwork from '@/services/knowledgeNetwork';
import DeleteModal from '../deleteModal/index';

const props = {
  visible: true,
  onCloseDelete: jest.fn(),
  onRefreshList: jest.fn(),
  delId: 1
};

servicesKnowledgeNetwork.knowledgeNetDelete = jest.fn(() => Promise.resolve({ res: 'success' }));
const init = (defaultProps = props) => mount(<DeleteModal {...defaultProps} />);

describe('UI render', () => {
  it('render test', async () => {
    init();
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
    const wrapper = init();

    const ok = wrapper.find('Button').at(1);

    act(() => {
      ok.simulate('click');
    });
    await sleep();

    expect(servicesKnowledgeNetwork.knowledgeNetDelete).toHaveBeenCalled();
    expect(props.onRefreshList).toHaveBeenCalled();
  });

  it('cancel btn', async () => {
    const wrapper = init(props);

    const cancel = wrapper.find('Button').at(0);

    act(() => {
      cancel.simulate('click');
    });
    await sleep();

    expect(props.onCloseDelete).toHaveBeenCalled();
  });
});

describe('error text', () => {
  it('error', async () => {
    servicesKnowledgeNetwork.knowledgeNetDelete = jest.fn(() =>
      Promise.resolve({ ErrorCode: 'Builder.service.knw_service.knwService.deleteKnw.GraphNotEmptyError' })
    );
    const wrapper = init(props);

    const ok = wrapper.find('Button').at(1);

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

    const ok = wrapper.find('Button').at(1);

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

    const ok = wrapper.find('Button').at(1);

    act(() => {
      ok.simulate('click');
    });
    await sleep();
  });
});
