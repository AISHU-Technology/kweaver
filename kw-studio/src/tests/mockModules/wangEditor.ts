jest.mock('@wangeditor/editor-for-react', () => ({
  Toolbar: () => null,
  Editor: () => null
}));

jest.mock('@wangeditor/editor', () => ({
  i18nChangeLanguage: jest.fn()
}));

export {};
