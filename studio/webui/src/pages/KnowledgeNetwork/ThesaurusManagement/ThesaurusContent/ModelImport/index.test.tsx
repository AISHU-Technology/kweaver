import React from 'react';
import { shallow, mount } from 'enzyme';
import ThesaurusImport from './index';
import type { UploadProps } from 'antd';
import { sleep } from '@/tests';
import { act } from 'react-test-renderer';
import serverThesaurus from '@/services/thesaurus';

const defaultProps = {
  selectedThesaurus: { id: 1 },
  getThesaurusById: jest.fn(),
  isVisible: true,
  closeModal: jest.fn()
};

serverThesaurus.thesaurusImportWords = jest.fn(() => Promise.resolve({ res: 'success' }));

const init = (props = defaultProps) => mount(<ThesaurusImport {...props} />);

const fileList: UploadProps['fileList'] = [
  {
    uid: '-1',
    name: 'xxx.txt',
    status: 'done',
    url: 'WPnJuuZ.txt',
    thumbUrl: 's.txt'
  }
];

describe('ThesaurusContent', () => {
  it('test render', async () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('import', () => {
  it('submit', async () => {
    const wrapper = init();
    await sleep();
    wrapper.update();
    console.log('wrapper:', wrapper);

    act(() => {
      wrapper
        .find('Upload')
        .at(0)
        .simulate('change', {
          target: {
            value: [
              {
                size: 67478,
                status: 'uploading',
                type: 'text/csv',
                uid: 'rc-upload-1668735959026-3',
                name: 'text'
              }
            ]
          }
        });
    });
    await sleep(10);
    wrapper.update();

    // act(() => {
    //   wrapper.find('.ant-btn.ant-btn-primary').at(0).simulate('click');
    // });

    // expect(serverThesaurus.thesaurusImportWords).toHaveBeenCalled();
    // console.log('up11:', wrapper.find('.ant-tag').length);
  });
});
