import React from 'react';
import { mount } from 'enzyme';
import { act, sleep } from '@/tests';
import serviceUploadKnowledge from '@/services/uploadKnowledge';
import serverKnowledgeNetwork from '@/services/knowledgeNetwork';
import UploadKnowledgeModal, { UploadKnowledgeModalProps } from './index';

serviceUploadKnowledge.uploadServiceGet = jest.fn(() =>
  Promise.resolve({
    res: {
      data: [{ id: 1, ip: '10.0.0.1', token: '1', created: '1', updated: '1' }],
      total: 1
    }
  })
);
serviceUploadKnowledge.uploadKnowledge = jest.fn(() => Promise.resolve({ res: 'success' }));
serverKnowledgeNetwork.graphGetByKnw = jest.fn(() =>
  Promise.resolve({
    res: {
      df: [{ id: 1, name: '图谱' }],
      count: 1
    }
  })
);
const kgData = { id: 1, color: 'red', knw_name: '知识网络', knw_description: '描述' };
const defaultProps = { kgData, visible: true, isNotGraph: false, onCancel: jest.fn() };
const init = (props: UploadKnowledgeModalProps = defaultProps) => mount(<UploadKnowledgeModal {...props} />);

describe('UploadKnowledgeModal', () => {
  it('test search graph', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();

    act(() => {
      wrapper
        .find('.ant-input')
        .at(0)
        .simulate('change', { target: { value: 'aaa' } });
    });
    await sleep(300);
    wrapper.update();
    // expect(wrapper.find('.ant-table-row').length).toBe(1);
  });
});
