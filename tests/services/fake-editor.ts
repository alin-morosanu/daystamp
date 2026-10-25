import type { Editor, EditorPosition, EditorTransaction } from 'obsidian';

/** Just enough of Editor over a plain string for the insert pipeline. */
export class FakeEditor {
  text: string;
  anchor: number;
  head: number;
  transactions = 0;
  focused = false;

  constructor(text: string, selection: [number, number] = [text.length, text.length]) {
    this.text = text;
    [this.anchor, this.head] = selection;
  }

  asEditor(): Editor {
    return this as unknown as Editor;
  }

  getCursor(which: 'from' | 'to' = 'to'): EditorPosition {
    const offset = which === 'from' ? Math.min(this.anchor, this.head) : Math.max(this.anchor, this.head);
    return this.offsetToPos(offset);
  }

  getRange(from: EditorPosition, to: EditorPosition): string {
    return this.text.slice(this.posToOffset(from), this.posToOffset(to));
  }

  posToOffset(pos: EditorPosition): number {
    const lines = this.text.split('\n');
    let offset = 0;
    for (let i = 0; i < pos.line; i++) offset += (lines[i]?.length ?? 0) + 1;
    return offset + Math.min(pos.ch, lines[pos.line]?.length ?? 0);
  }

  offsetToPos(offset: number): EditorPosition {
    const before = this.text.slice(0, offset).split('\n');
    return { line: before.length - 1, ch: before[before.length - 1]?.length ?? 0 };
  }

  transaction(tx: EditorTransaction): void {
    this.transactions++;
    for (const change of tx.changes ?? []) {
      const from = this.posToOffset(change.from);
      const to = this.posToOffset(change.to ?? change.from);
      this.text = this.text.slice(0, from) + change.text + this.text.slice(to);
    }
  }

  setCursor(pos: EditorPosition): void {
    this.anchor = this.head = this.posToOffset(pos);
  }

  focus(): void {
    this.focused = true;
  }

  /** The text with `|` at the cursor, for readable assertions. */
  show(): string {
    return `${this.text.slice(0, this.head)}|${this.text.slice(this.head)}`;
  }
}
