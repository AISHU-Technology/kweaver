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

describe('SqlExtractModalComponent', () => {
  it('SqlExtractModalComponent is exists', () => {
    const props = {
      onCancel: () => {},
      editData: {},
      listData: []
    };
    const wrapper = init(props);
    expect(wrapper.exists()).toBe(true);
  });
});
