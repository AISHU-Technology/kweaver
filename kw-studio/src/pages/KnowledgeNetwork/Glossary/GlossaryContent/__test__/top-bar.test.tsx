import React from 'react';
import { shallow } from 'enzyme';
import TopBar from '../TopBar';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <TopBar {...props} />
    </GlossaryContext>
  );

describe('LeftListPage', () => {
  it('LeftListPage is exists', () => {
    const props = {
      openCustomRelationModal: () => {},
      goBack: () => {},
      openCreateModal: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
