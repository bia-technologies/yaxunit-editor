import { languages } from 'monaco-editor-core';
import { completionItemProvider } from '../../bsl/features/completionItemProvider'
import { signatureHelpProvider } from '../../bsl/features/signatureHelpProvider'
import { documentSymbolProvider } from '../../bsl/features/documentSymbolProvider';
import { hoverProvider } from '@/bsl/features/hoverProvider';

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
    languages.registerCompletionItemProvider(language.id, completionItemProvider);
    languages.registerSignatureHelpProvider(language.id, signatureHelpProvider)
    languages.registerDocumentSymbolProvider(language.id, documentSymbolProvider)
    languages.registerHoverProvider(language.id, hoverProvider)
  });
});
