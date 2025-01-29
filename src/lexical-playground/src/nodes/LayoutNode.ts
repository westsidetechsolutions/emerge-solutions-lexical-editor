import {ElementNode} from 'lexical';

export class LayoutContainerNode extends ElementNode {
  static getType(): string {
    return 'layout-container';
  }
}

export class LayoutItemNode extends ElementNode {
  static getType(): string {
    return 'layout-item';
  }
} 