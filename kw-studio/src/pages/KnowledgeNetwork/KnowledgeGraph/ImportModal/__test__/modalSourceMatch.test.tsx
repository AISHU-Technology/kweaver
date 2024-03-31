import React from 'react';
import { act } from '@/tests';
import { mount } from 'enzyme';

import { knData, modalFeedbackData } from './mock';
import ModalSourceMatch from '../ModalSourceMatch';

jest.mock('@/services/dataSource', () => ({
  dataSourceGet: () =>
    Promise.resolve({
      res: {
        count: 1,
        df: [
          {
            connect_type: '',
            create_time: '222',
            create_user: 'ddd',
            create_user_name: 'xxx',
            dataType: 'structured',
            data_source: 'mysql',
            ds_address: '10.4.109.191',
            ds_auth: null,
            ds_password: 'afewf',
            ds_path: 'GTQA',
            ds_port: 2086,
            ds_user: 'root',
            dsname: '国泰君安',
            extract_type: 'standardExtraction',
            id: 2,
            json_schema: '',
            knw_id: 1,
            queue: '',
            update_time: '222',
            update_user: 'ddd',
            update_user_name: 'ccc',
            vhost: ''
          }
        ]
      }
    }),
  taskCreate: () => Promise.resolve({ res: 'ok' })
}));

jest.mock('@/services/knowledgeNetwork', () => ({
  graphInput: () => Promise.resolve({ res: 'ok' })
}));

const defaultProps = {
  modalFeedbackData,
  onHandleClose: jest.fn(),
  fileData: { uid: 'rc-upload-1703034630663-2' },
  knData,
  closeModalFeedback: jest.fn(),
  fileReName: '文件',
  onPrev: jest.fn(),
  usedSourceList: [{ id: 2, dsname: '国泰君安', ds_path: 'GTQA', dataType: 'structured', data_source: 'mysql' }],
  setUsedSourceList: jest.fn(),
  dataTypeList: [],
  setDataTypeList: jest.fn(),
  sourceMapping: {},
  setSourceMapping: jest.fn(),
  onTabSkip: jest.fn(),
  onSetSelectedId: jest.fn()
};

const init = (props = defaultProps) => mount(<ModalSourceMatch {...props} />);

describe('test', () => {
  it('test UI', () => {
    const wrapper = init();
    expect(wrapper.find('.title').at(0).text()).toBe('初始数据源');
    expect(wrapper.find('.title').at(1).text()).toBe('目标数据源');
    expect(wrapper.find('.source-box-left').length).toBe(modalFeedbackData?.length);
    expect(wrapper.find('.source-box-right').length).toBe(modalFeedbackData?.length);
  });

  it('test source-left', () => {
    const wrapper = init();
    expect(wrapper.find('.other-message-dsName').at(0).text()).toBe(
      modalFeedbackData?.[0]?.ds_basic_infos?.[0]?.dsname
    );
  });
});

describe('test Function', () => {
  it('test Click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.source-box-right').find('Select').simulate('click');
    });
  });
});
