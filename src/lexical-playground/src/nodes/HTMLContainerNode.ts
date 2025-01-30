import { ElementNode, SerializedElementNode, Spread } from 'lexical';
import { DecoratorNode } from 'lexical';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalNode } from 'lexical';

// Define the serialized format
export type SerializedHTMLContainerNode = Spread<{
  type: 'html-container';
  version: 1;
  tag: string;
  style: string;
}, SerializedElementNode>;

// HTMLContainerNode class
export class HTMLContainerNode extends ElementNode {
  __tag: string;
  __style: string;

  static getType(): string {
    return 'html-container';
  }

  static clone(node: HTMLContainerNode): HTMLContainerNode {
    return new HTMLContainerNode(node.__tag, node.__style, node.__key);
  }

  constructor(tag: string, style: string = '', key?: string) {
    super(key);
    this.__tag = tag;
    this.__style = style;
  }

  createDOM(config: any): HTMLElement {
    const element = document.createElement(this.__tag);
    element.style.cssText = this.__style;
    // Make the container non-editable
    element.style.pointerEvents = 'none';
    return element;
  }

  updateDOM(prevNode: HTMLContainerNode, dom: HTMLElement): boolean {
    if (prevNode.__tag !== this.__tag || prevNode.__style !== this.__style) {
      dom.tagName.toLowerCase() !== this.__tag && (dom.tagName.toLowerCase() === this.__tag);
      dom.style.cssText = this.__style;
      return true;
    }
    return false;
  }

  isEditable(): boolean {
    return false; // Container itself is not editable
  }

  exportJSON(): SerializedHTMLContainerNode {
    return {
      ...super.exportJSON(),
      type: 'html-container',
      tag: this.__tag,
      style: this.__style,
    };
  }

  static importJSON(serializedNode: SerializedHTMLContainerNode): HTMLContainerNode {
    const tag = serializedNode.tag;
    const style = serializedNode.style;
    return new HTMLContainerNode(tag, style);
  }

  // Prevent deletion of the container node
  remove() {
    // Do not allow removal
    return false;
  }

  // Prevent merging with adjacent nodes
  canMergeWith(node: LexicalNode): boolean {
    return false;
  }

  // Prevent inserting new nodes before or after the container
  canInsertTextBefore(): boolean {
    return false;
  }

  canInsertTextAfter(): boolean {
    return false;
  }

  // Prevent certain commands
  isStyleText(): boolean {
    return false;
  }

  // Override other methods as necessary to protect the structure
} 