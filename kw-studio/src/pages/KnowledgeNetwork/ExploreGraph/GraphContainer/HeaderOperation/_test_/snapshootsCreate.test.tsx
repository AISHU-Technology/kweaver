import React from 'react';
import { shallow } from 'enzyme';
import SnapshootsCreate from '../ModelSnapshoots/SnapshootsCreate';

describe('SnapshootsCreate', () => {
  const props = {
    updateData: {},
    selectedItem: {},
    serviceData: {},
    onOk: () => {},
    onCancel: () => {}
  };

  it('SnapshootsCreate have class', () => {
    const app = shallow(<SnapshootsCreate {...props} />);
    expect(app.find('.snapshootsCreateRoot').exists()).toBe(true);
  });
});
