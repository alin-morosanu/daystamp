// Runtime stand-in for the `obsidian` module in services tests (types still come from the real package).
export { default as moment } from 'moment';

export class MarkdownView {
  editor: unknown;
  private mode: 'source' | 'preview';

  constructor(editor: unknown, mode: 'source' | 'preview' = 'source') {
    this.editor = editor;
    this.mode = mode;
  }

  getMode(): 'source' | 'preview' {
    return this.mode;
  }
}
