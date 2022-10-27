import React from 'react';
import { mount } from 'enzyme';
import { act } from '@/tests';
import KnowledgeInfo from '../KnowledgeInfo';
import _ from 'lodash';
import { mockIQList } from './mockData';

jest.mock('@/components/KnowledgeModal', () => {
  const KnowledgeModal = () => <div />;
  KnowledgeModal.displayName = 'KnowledgeModal';
  return KnowledgeModal;
});

const defaultProps = { kgInfo: {} as any, onEditSuccess: jest.fn() };
const init = (props = defaultProps) => mount(<KnowledgeInfo {...props} />);

describe('DomainIQ/KnowledgeInfo', () => {
  it('test empty', () => {
    const wrapper = init();
    expect(wrapper.find('.name-title').first().text()).toBe('--');
  });

  it('test render', () => {
    const wrapper = init();
    wrapper.setProps({ kgInfo: mockIQList.res });
    expect(wrapper.find('.name-title').first().text()).toBe(mockIQList.res.knw_name);
  });

  it('test edit', () => {
    const wrapper = init();
    wrapper.setProps({ kgInfo: mockIQList.res });

    act(() => {
      wrapper.find('.icon-click-mask').first().simulate('click');
    });
    wrapper.update();
    const { visible } = wrapper.find('KnowledgeModal').props() as any;
    expect(visible).toBe(true);

    const spyOnEditSuccess = jest.spyOn(wrapper.props(), 'onEditSuccess');
    (wrapper.find('KnowledgeModal').invoke as Function)('onSuccess')();
    expect(spyOnEditSuccess).toHaveBeenCalled();
  });
});
