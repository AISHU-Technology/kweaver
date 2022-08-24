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
const defaultProps = { kgData, visible: true, isNotGraph: false, setVisible: jest.fn() };
const init = (props: UploadKnowledgeModalProps = defaultProps) => mount(<UploadKnowledgeModal {...props} />);

describe('UploadKnowledgeModal', () => {
  it('test upload', async () => {
    const wrapper = init();

    await sleep();
    wrapper.update();
    // 选择地址
    act(() => {
      wrapper.find('.ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').first().simulate('click');
    });
    await sleep();
    wrapper.update();

    // 勾选图谱
    act(() => {
      wrapper
        .find('.graph-header .ant-checkbox-input')
        .at(0)
        .simulate('change', { target: { checked: true } });
    });
    wrapper.update();
    expect(wrapper.find('.graph-header Checkbox').at(0).props().checked).toBe(true);

    // 点击上传
    act(() => {
      wrapper.find('.create-btn').at(0).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(document.querySelector('.ant-message')).toBeTruthy();
  });
});
