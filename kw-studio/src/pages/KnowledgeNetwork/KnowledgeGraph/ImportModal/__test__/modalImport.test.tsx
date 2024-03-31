import React from 'react';
import { act } from '@/tests';
import { mount } from 'enzyme';
import intl from 'react-intl-universal';

import ModalImport from '../ModalImport';
import { modalFeedbackData } from './mock';

jest.mock('@/services/license', () => ({
  graphCountAll: () => Promise.resolve({ res: { all_knowledge: '1225852', knowledge_limit: -1 } })
}));

jest.mock('@/services/knowledgeNetwork', () => ({
  graphGetByKnw: () =>
    Promise.resolve({
      res: [
        {
          createUser: 'test',
          create_time: '2023-12-19 14:21:41',
          export: true,
          graph_db_name: 'udfc0077a9e3611eea3e5966bfe9ec6d2',
          id: 2,
          is_import: true,
          kgDesc: '',
          knowledge_type: 'kg',
          knw_id: 1,
          name: '国泰君安',
          otl_id: '2',
          rabbitmqDs: 0,
          status: 'normal',
          step_num: 4,
          taskstatus: 'normal',
          updateTime: '2023-12-19 16:50:40',
          updateUser: 'test'
        },
        {
          createUser: 'test',
          create_time: '2023-12-18 10:28:01',
          export: true,
          graph_db_name: 'u10abdeda9d4d11eea9cc966bfe9ec6d2',
          id: 1,
          is_import: true,
          kgDesc: '',
          knowledge_type: 'kg',
          knw_id: 1,
          name: '化工与工艺反应知识图谱_new',
          otl_id: '1',
          rabbitmqDs: 0,
          status: 'normal',
          step_num: 6,
          taskstatus: 'normal',
          updateTime: '2023-12-18 10:31:25',
          updateUser: 'test'
        }
      ]
    })
}));

const defaultProps = {
  onClose: jest.fn(),
  modalFeedbackData,
  setModalFeedbackData: jest.fn(),
  fileData: { uid: 'rc-upload-1703034630663-2' },
  setFileData: jest.fn(),
  btnContent: false,
  setBtnContent: jest.fn(),
  fileReName: '',
  setFileReName: jest.fn(),
  fileName: '国泰君安',
  setFileName: jest.fn(),
  step: 0,
  setIsVisibleImport: jest.fn()
};
const init = (props = defaultProps) => mount(<ModalImport {...props} />);

describe('ModalImport', () => {
  test('class modalImportRoot is exists', () => {
    const wrapper = init();
    expect(wrapper.find('.graph-import-modal-first-step-root').exists()).toBe(true);
    expect(wrapper.find('.extraBox').exists()).toBe(true);
    expect(wrapper.find('.close-icon').exists()).toBe(true);
  });

  test(' fileData empty', () => {
    const wrapper = init();
    wrapper.setProps({ ...defaultProps, fileData: {} });
    expect(wrapper.find('.close-icon').exists()).toBe(false);
  });

  test('form have 3 children', () => {
    const wrapper = init();
    expect(wrapper.find('#importForm').children()).toHaveLength(3);
  });
});

describe('test Function', () => {
  it('test click', () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.close-icon').at(0).simulate('click');
    });
  });
});
