import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import ConfigModal, { ConfigModalProps } from '../ConfigModal';
import { mockEditData, mockGraphData } from './mockData';
import { convertData } from '../assistFunction';

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
    expect(wrapper.exists()).toBe(true);
  });
});
