import {languages} from 'monaco-editor';
import BslCompletionItemProvider from './completion'

interface ILangImpl {
  conf: languages.LanguageConfiguration;
  language: languages.IMonarchLanguage;
}

const language: languages.ILanguageExtensionPoint = {
  id: "bsl",
  extensions: [".bsl"],
};

languages.register(language);

languages.onLanguage(language.id, () => {
  import("./configuration").then((module: ILangImpl) => {
    languages.setLanguageConfiguration(language.id, module.conf);
    languages.setMonarchTokensProvider(language.id, module.language);
    languages.registerCompletionItemProvider(language.id, BslCompletionItemProvider)
  });
});
