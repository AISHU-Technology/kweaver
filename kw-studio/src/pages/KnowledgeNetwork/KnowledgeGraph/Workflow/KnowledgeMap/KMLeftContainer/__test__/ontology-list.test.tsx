import React from 'react';
import { shallow } from 'enzyme';
import OntologyList from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMLeftContainer/OntologyList/OntologyList';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

const init = (props: any) =>
  shallow(
    <KnowledgeMapContext currentStep={3}>
      <OntologyList {...props} />
    </KnowledgeMapContext>
  );

describe('OntologyListComponent', () => {
  it('OntologyListComponent is exists', () => {
    const props = {
      onCancelSelected: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
