import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ConfigModal, { ConfigModalProps } from '../ConfigModal';
import { mockEditData, mockGraphData } from './mockData';
import { convertData } from '../assistFunction';

jest.mock('../ConfigModal/ConfigGraph', () => (props = {}) => {
  const MockConfigGraph: any = () => <div />;
  return <MockConfigGraph className="mock-config-graph" {...props} />;
});
jest.mock('../ConfigModal/BaseInfo', () => (props = {}) => {
  const MockBaseInfo: any = () => <div />;
  return <MockBaseInfo className="mock-base-info" {...props} />;
});

const defaultProps = {
  viewOnly: false,
  visible: true,
  setVisible: jest.fn(),
  baseInfo: mockEditData.res,
  graphData: convertData(mockGraphData.res.df[0]),
  defaultTab: 'node',
  defaultConfig: { nodeScope: [], nodeRes: [], edgeScope: [] },
  onOk: jest.fn()
};
const init = (props: ConfigModalProps = defaultProps) => mount(<ConfigModal {...props} />);

describe('CognitiveSearch/ConfigModal', () => {
  it('test viewOnly', async () => {
    const wrapper = init();
    wrapper.setProps({ viewOnly: true, defaultTab: 'base' });
    wrapper.update();
    expect(wrapper.find('.mock-base-info').exists()).toBe(true);
    expect(wrapper.find('.config-btn').exists()).toBe(false);
  });

  it('test switch change', () => {
    const wrapper = init();

    // 点类全选
    act(() => {
      wrapper.find('.th2 .ant-switch').first().simulate('click');
    });
    act(() => {
      wrapper.find('.th3 .ant-switch').first().simulate('click');
    });
    wrapper.update();
    wrapper
      .find('.list-box')
      .first()
      .find('.ant-switch')
      .forEach(el => {
        expect(el.hasClass('ant-switch-checked')).toBe(true);
      });

    // 点类带动上边全选, 取消边类全选
    act(() => {
      wrapper.find('.ant-tabs-tab').last().simulate('click');
    });
    act(() => {
      wrapper.find('.th2 .ant-switch').last().simulate('click');
    });
    wrapper.update();
    wrapper
      .find('.list-box')
      .last()
      .find('.ant-switch')
      .forEach(el => {
        expect(el.hasClass('ant-switch-checked')).toBe(false);
      });
  });

  // it('test search', async () => {
  //   const wrapper = init();

  //   act(() => {
  //     wrapper
  //       .find('.search-input input')
  //       .first()
  //       .simulate('change', { target: { value: 'A' } });
  //   });
  //   await sleep();
  //   act(() => {
  //     wrapper.find('.search-input').first().simulate('keypress', { key: 'Enter' });
  //   });
  //   wrapper.update();
  //   console.log(wrapper.html());
  // });
});
