import React from 'react';
import { shallow } from 'enzyme';
import RelationShips from '../RelationShips';
import GlossaryContext from '@/pages/KnowledgeNetwork/Glossary/GlossaryContext';

const init = (props: any) =>
  shallow(
    <GlossaryContext>
      <RelationShips {...props} />
    </GlossaryContext>
  );

describe('RelationShipsPage', () => {
  it('RelationShipsPage is exists', () => {
    const props = {
      openCustomRelationModal: () => {},
      setSelectedNodeByTerm: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
