import React from 'react';
import { shallow } from 'enzyme';
import AddDataFileModal from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KMRightContainer/AddDataFileModal/AddDataFileModal';
import KnowledgeMapContext from '@/pages/KnowledgeNetwork/KnowledgeGraph/Workflow/KnowledgeMap/KnowledgeMapContext';

const init = (props: any) =>
  shallow(
    <KnowledgeMapContext currentStep={3}>
      <AddDataFileModal {...props} />
    </KnowledgeMapContext>
  );

describe('AddDataFileModalComponent', () => {
  it('AddDataFileModalComponent is exists', () => {
    const props = {
      onCancel: () => {},
      editData: {},
      defaultParsingRule: { delimiter: ',', quotechar: '"', escapechar: '"' },
      parsingSet: [],
      setParsingSet: (data: any) => {},
      selectFileType: {},
      setSelectFileType: () => {},
      parsingTreeChange: [],
      setParsingTreeChange: (data: any) => {},
      currentParse: [],
      setCurrentParse: () => {}
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
