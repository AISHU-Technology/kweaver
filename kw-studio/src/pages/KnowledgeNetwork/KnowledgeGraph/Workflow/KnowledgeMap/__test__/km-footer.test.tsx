import React from 'react';
import { shallow } from 'enzyme';
import KMFooter from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMFooter/KMFooter';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

const init = (props: any) =>
  shallow(
    <KnowledgeMapContext currentStep={3}>
      <KMFooter {...props} />
    </KnowledgeMapContext>
  );

describe('KMFooterComponent', () => {
  it('KMFooterComponent is exists', () => {
    const props = {
      onPrev: () => {}, // 上一步
      onSave: () => {} // 保存按钮
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
