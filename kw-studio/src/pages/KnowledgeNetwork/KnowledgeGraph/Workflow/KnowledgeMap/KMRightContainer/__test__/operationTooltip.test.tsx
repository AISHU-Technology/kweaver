import React from 'react';
import { shallow } from 'enzyme';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import OperationTooltip from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/OperationTooltip/OperationTooltip';

const init = (props: any) =>
  shallow(
    <KnowledgeMapContext currentStep={3}>
      <OperationTooltip />
    </KnowledgeMapContext>
  );

describe('OperationTooltipComponent', () => {
  it('OperationTooltipComponent is exists', () => {
    const props = {};
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
