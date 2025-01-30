import { TextNode, SerializedTextNode, Spread, TextFormatType } from 'lexical';

// Define the serialized format
export type SerializedEditableTextNode = Spread<{
  type: 'editable-text';
  version: 1;
}, SerializedTextNode>;

// EditableTextNode class
export class EditableTextNode extends TextNode {
  static getType(): string {
    return 'editable-text';
  }

  static clone(node: EditableTextNode): EditableTextNode {
    return new EditableTextNode(node.__text, node.__key);
  }

  exportJSON(): SerializedEditableTextNode {
    return {
      ...super.exportJSON(),
      type: 'editable-text',
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedEditableTextNode): EditableTextNode {
    const text = serializedNode.text;
    return new EditableTextNode(text);
  }

  // Allow formatting to be applied and removed
  applyFormat(format: TextFormatType): void {
    this.setFormat(format);
  }

  removeFormat(format: TextFormatType): void {
    this.setFormat(0);
  }
} 