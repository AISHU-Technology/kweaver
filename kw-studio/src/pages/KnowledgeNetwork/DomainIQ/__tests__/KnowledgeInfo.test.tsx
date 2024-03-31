import React from 'react';
import { mount } from 'enzyme';
import KnowledgeInfo from '../KnowledgeInfo';

const defaultProps = { kgInfo: {} as any, onEditSuccess: jest.fn() };
const init = (props = defaultProps) => mount(<KnowledgeInfo {...props} />);

describe('DomainIQ/KnowledgeInfo', () => {
  it('test empty', () => {
    const wrapper = init();
    expect(wrapper.exists()).toBe(true);
  });
});
