import React from 'react';
import { mount } from 'enzyme';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';
import KnowledgeMapX6 from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/KnowledgeMapX6/KnowledgeMapX6';

const init = (props: any) =>
  mount(
    <KnowledgeMapContext currentStep={3}>
      <KnowledgeMapX6 {...props} />
    </KnowledgeMapContext>
  );

describe('KnowledgeMapX6Component', () => {
  it('KnowledgeMapX6Component is exists', () => {
    const props = {
      onEditDataFile: () => {},
      defaultParsingRule: { delimiter: ',', quotechar: '"', escapechar: '"' },
      parsingSet: [],
      setParsingSet: (data: any) => {},
      selectFileType: {},
      setSelectFileType: () => {},
      onX6BlankClick: () => {},
      isAutoMapPropsSignRef: {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
