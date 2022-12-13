import React from 'react';
import { shallow } from 'enzyme';
import NodeInfo from './index';

describe('UI test', () => {
  it('renders without crashing', () => {
    shallow(
      <NodeInfo
        selectedElement={{
          name: 'name',
          uid: 1,
          source_table: ['1', '2', '3'],
          properties: []
        }}
      />
    );
  });
});
