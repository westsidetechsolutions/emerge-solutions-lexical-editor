import {
  $createParagraphNode,
  $isElementNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  LexicalNode,
  SerializedElementNode,
} from 'lexical';

export class CollapsibleContainerNode extends ElementNode {
  static getType(): string {
    return 'collapsible-container';
  }
}

export class CollapsibleTitleNode extends ElementNode {
  static getType(): string {
    return 'collapsible-title';
  }
}

export class CollapsibleContentNode extends ElementNode {
  static getType(): string {
    return 'collapsible-content';
  }
} 