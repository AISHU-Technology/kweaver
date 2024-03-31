jest.mock('@uiw/codemirror-themes', () => ({
  createTheme: jest.fn().mockReturnValue({
    theme: 'light',
    settings: {},
    styles: []
  })
}));

jest.mock('@lezer/highlight', () => ({
  tags: { name: 'aaa', literal: '' }
}));

export {};
