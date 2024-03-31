import React from 'react';
import { mount } from 'enzyme';
import RelevanceModal from '../CustomTable/RelevanceModal';
import { KnwItem } from '../types';
import { act, triggerPropsFunc } from '@/tests';
import { kgNames } from './mockData';

export interface RelevanceModalProps {
  visible: boolean;
  setRelevanceModal: () => void;
  relevanceList: any;
}

const defaultProps: RelevanceModalProps = {
  visible: true,
  setRelevanceModal: jest.fn(),
  relevanceList: kgNames
};

const init = (props = defaultProps) => mount(<RelevanceModal {...props} />);

describe('test UI', () => {
  it('UI', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});

describe('test Function', () => {
  it('test click', async () => {
    const wrapper = init();
    act(() => {
      wrapper.find('.ant-modal-close-x').at(0).simulate('click');
    });
  });
});
