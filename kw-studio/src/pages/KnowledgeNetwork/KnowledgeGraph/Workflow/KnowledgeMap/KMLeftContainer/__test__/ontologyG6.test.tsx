import React from 'react';
import { shallow } from 'enzyme';
import OntologyG6 from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMLeftContainer/OntologyG6/OntologyG6';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

const init = (props: any) =>
  shallow(
    <KnowledgeMapContext currentStep={3}>
      <OntologyG6 {...props} />
    </KnowledgeMapContext>
  );

describe('OntologyG6Component', () => {
  it('OntologyG6Component is exists', () => {
    const props = {};
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
