import React from 'react';
import { shallow } from 'enzyme';
import KMLeftContainer from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMLeftContainer/KMLeftContainer';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

const init = (props: any) =>
  shallow(
    <KnowledgeMapContext currentStep={3}>
      <KMLeftContainer {...props} />
    </KnowledgeMapContext>
  );

describe('KMLeftContainerComponent', () => {
  it('KMLeftContainerComponent is exists', () => {
    const props = {
      onOntologyDisplayTypeChange: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
