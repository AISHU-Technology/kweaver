import React from 'react';
import { shallow } from 'enzyme';
import GlossaryInfoTabs from '../index';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <GlossaryInfoTabs {...props} />
    </GlossaryContext>
  );

describe('GlossaryInfoTabsPage', () => {
  it('GlossaryInfoTabsPage is exists', () => {
    const props = {
      refreshTerm: () => {},
      openCustomRelationModal: () => {},
      setSelectedNodeByTerm: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
