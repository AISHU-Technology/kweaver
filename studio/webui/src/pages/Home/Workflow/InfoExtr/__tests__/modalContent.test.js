/* eslint-disable react/no-string-refs */
import React from 'react';
import { mount } from 'enzyme';
import { sleep, act } from '@/tests';
import { mockStep2Data, mockModels, mockDirPre, mockFilePre, mockSheet, mockModelPro, mockSheetList } from './mockData';
import servicesCreateEntity from '@/services/createEntity';
import ModalContent from '../ModalContent/index';

// 获取数据源
servicesCreateEntity.getFlowSource = jest.fn(() =>
  Promise.resolve({ res: { count: mockStep2Data.length, df: mockStep2Data } })
);
// 获取as文件或数据库表列表
servicesCreateEntity.getDataList = jest.fn(({ data_source }) =>
  Promise.resolve(data_source.includes('as') ? { res: mockDirPre } : { res: mockSheetList })
);
// 模型预览
servicesCreateEntity.getModelPreview = jest.fn(() => Promise.resolve({ res: { modelspo: mockModelPro } }));
// 文件预览或数据表预览
servicesCreateEntity.getOtherPreData = jest.fn(({ id }) =>
  Promise.resolve(id === 2 ? { res: mockSheet } : mockFilePre)
);

const test = {};
const defaultProps = {
  graphId: 1,
  modelList: mockModels,
  subscriptionState: { smartSearchState: true },
  total: 2
};
const init = (props = defaultProps) => mount(<ModalContent {...props} />, { ref: test });

describe('UI is render', () => {
  // 是否渲染
  it('should render', async () => {
    init();
    await sleep();
  });
});

describe('Function is called', () => {
  // 切换数据源
  it('test select data source', async () => {
    const wrapper = init();

    // 默认选中第一条, 非结构化模型抽取
    await sleep();
    wrapper.update();
    expect(wrapper.find('Select.select-file').at(0).props().value).toBe(mockStep2Data[0].dsname);
    expect(servicesCreateEntity.getModelPreview).toHaveBeenCalled();

    // 切换第二条, 结构化数据库抽取
    act(() => {
      wrapper.find('Select.select-file .ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(1).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('Select.select-file').at(0).props().value).toBe(mockStep2Data[1].dsname);

    // 切换第三条, 结构化文件抽取
    act(() => {
      wrapper.find('Select.select-file .ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-item-option').at(2).simulate('click');
    });
    await sleep();
    wrapper.update();
    expect(wrapper.find('Select.select-file').at(0).props().value).toBe(mockStep2Data[2].dsname);
  });

  // 计数
  it('test source count', async () => {
    const wrapper = init();

    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('TreeSelect .ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-tree-node-content-wrapper').at(0).simulate('click');
    });
    wrapper.update();
    expect(wrapper.find('.extract-count span').text()).toBe(`${wrapper.props().total + 1}`);
  });

  // 添加数据源方法
  it('test addFile', async () => {
    // mock一个父组件来调用内部方法
    class MockWrapper extends React.Component {
      render() {
        return <ModalContent {...defaultProps} ref="mockRef" />;
      }
    }

    const wrapper = mount(<MockWrapper />);
    let res;

    await sleep();
    wrapper.update();

    // 未选择
    act(() => {
      res = wrapper.ref('mockRef').addFile();
    });
    expect(res).toBeFalsy();

    // 正常选择
    act(() => {
      wrapper.find('TreeSelect .ant-select-selector').at(0).simulate('mousedown');
    });
    await sleep();
    wrapper.update();
    act(() => {
      wrapper.find('.ant-select-tree-node-content-wrapper').at(0).simulate('click');
    });
    wrapper.update();
    act(() => {
      res = wrapper.ref('mockRef').addFile();
    });
    expect(res.selectSource).toEqual(mockStep2Data[0]);
    expect(res.asSelectValue).toEqual(['{"docid":"gns1","name":"文件夹","file_path":"文件夹","type":"dir"}']);
  });
});
