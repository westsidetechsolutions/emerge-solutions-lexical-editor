/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import './index.css';

import {$isCodeHighlightNode} from '@lexical/code';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {mergeRegister} from '@lexical/utils';
import {
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import {Dispatch, useCallback, useEffect, useRef, useState} from 'react';

import {createPortal} from 'react-dom';

import {getDOMRangeRect} from '../../utils/getDOMRangeRect';
import {getSelectedNode} from '../../utils/getSelectedNode';
import {setFloatingElemPosition} from '../../utils/setFloatingElemPosition';
import {INSERT_INLINE_COMMAND} from '../CommentPlugin';
import useModal from '../../hooks/useModal';
import {sanitizeUrl} from '../../utils/url';
import AssetManager from '../../components/AssetManager';
import * as React from 'react';

function TextFormatFloatingToolbar({
  editor,
  anchorElem,
  isLink,
  isBold,
  isItalic,
  isUnderline,
  setIsLinkEditMode,
  setIsLink,
}: {
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  isBold: boolean;
  isItalic: boolean;
  isLink: boolean;
  isUnderline: boolean;
  setIsLinkEditMode: Dispatch<boolean>;
  setIsLink: Dispatch<boolean>;
}): JSX.Element {
  const popupCharStylesEditorRef = useRef<HTMLDivElement | null>(null);
  const [modal, showModal] = useModal();

  const insertLink = useCallback(() => {
    if (!isLink) {
      showModal('Insert Link', (onClose) => (
        <div className="flex flex-col gap-2">
          <button
            className="btn btn-sm btn-primary w-full"
            onClick={() => {
              onClose();
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://');
                  setIsLink(true);
                  setIsLinkEditMode(true);
                }
              });
            }}>
            Enter URL
          </button>

          <button
            className="btn btn-sm btn-primary w-full"
            onClick={() => {
              onClose();
              showModal('Select File', (onFileClose) => (
                <AssetManager
                  isOpen={true}
                  onClose={onFileClose}
                  onSelect={(asset) => {
                    onFileClose();
                    setIsLinkEditMode(true);
                    editor.dispatchCommand(
                      TOGGLE_LINK_COMMAND,
                      sanitizeUrl(asset.url),
                    );
                  }}
                  mode="link"
                />
              ));
            }}>
            Select a File
          </button>
        </div>
      ));
    } else {
      setIsLinkEditMode(false);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink, setIsLinkEditMode, showModal]);

  function mouseMoveListener(e: MouseEvent) {
    if (
      popupCharStylesEditorRef?.current &&
      (e.buttons === 1 || e.buttons === 3)
    ) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'none') {
        const x = e.clientX;
        const y = e.clientY;
        const elementUnderMouse = document.elementFromPoint(x, y);

        if (!popupCharStylesEditorRef.current.contains(elementUnderMouse)) {
          // Mouse is not over the target element => not a normal click, but probably a drag
          popupCharStylesEditorRef.current.style.pointerEvents = 'none';
        }
      }
    }
  }
  function mouseUpListener(e: MouseEvent) {
    if (popupCharStylesEditorRef?.current) {
      if (popupCharStylesEditorRef.current.style.pointerEvents !== 'auto') {
        popupCharStylesEditorRef.current.style.pointerEvents = 'auto';
      }
    }
  }

  useEffect(() => {
    if (popupCharStylesEditorRef?.current) {
      document.addEventListener('mousemove', mouseMoveListener);
      document.addEventListener('mouseup', mouseUpListener);

      return () => {
        document.removeEventListener('mousemove', mouseMoveListener);
        document.removeEventListener('mouseup', mouseUpListener);
      };
    }
  }, [popupCharStylesEditorRef]);

  const $updateTextFormatFloatingToolbar = useCallback(() => {
    const selection = $getSelection();

    const popupCharStylesEditorElem = popupCharStylesEditorRef.current;
    const nativeSelection = window.getSelection();

    if (popupCharStylesEditorElem === null) {
      return;
    }

    const rootElement = editor.getRootElement();
    if (
      selection !== null &&
      nativeSelection !== null &&
      !nativeSelection.isCollapsed &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const rangeRect = getDOMRangeRect(nativeSelection, rootElement);

      setFloatingElemPosition(
        rangeRect,
        popupCharStylesEditorElem,
        anchorElem,
        isLink,
      );
    }
  }, [editor, anchorElem, isLink]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateTextFormatFloatingToolbar();
      });
    };

    window.addEventListener('resize', update);
    if (scrollerElem) {
      scrollerElem.addEventListener('scroll', update);
    }

    return () => {
      window.removeEventListener('resize', update);
      if (scrollerElem) {
        scrollerElem.removeEventListener('scroll', update);
      }
    };
  }, [editor, $updateTextFormatFloatingToolbar, anchorElem]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateTextFormatFloatingToolbar();
    });
    return mergeRegister(
      editor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          $updateTextFormatFloatingToolbar();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateTextFormatFloatingToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, $updateTextFormatFloatingToolbar]);

  return (
    <>
      <div ref={popupCharStylesEditorRef} className="floating-text-format-popup">
        {editor.isEditable() && (
          <>
            <button
              type="button"
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
              }}
              className={'popup-item spaced ' + (isBold ? 'active' : '')}
              aria-label="Format text as bold">
              <i className="format bold" />
            </button>
            <button
              type="button"
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
              }}
              className={'popup-item spaced ' + (isItalic ? 'active' : '')}
              aria-label="Format text as italics">
              <i className="format italic" />
            </button>
            <button
              type="button"
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
              }}
              className={'popup-item spaced ' + (isUnderline ? 'active' : '')}
              aria-label="Format text to underlined">
              <i className="format underline" />
            </button>
            <button
              type="button"
              onClick={insertLink}
              className={'popup-item spaced ' + (isLink ? 'active' : '')}
              aria-label="Insert link">
              <i className="format link" />
            </button>
          </>
        )}
      </div>
      {modal}
    </>
  );
}

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  setIsLinkEditMode: Dispatch<boolean>,
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // Update links
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node) || $isParagraphNode(node));
      } else {
        setIsText(false);
      }

      const rawTextContent = selection.getTextContent().replace(/\n/g, '');
      if (!selection.isCollapsed() && rawTextContent === '') {
        setIsText(false);
        return;
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
    );
  }, [editor, updatePopup]);

  if (!isText) {
    return null;
  }

  return createPortal(
    <TextFormatFloatingToolbar
      editor={editor}
      anchorElem={anchorElem}
      isLink={isLink}
      isBold={isBold}
      isItalic={isItalic}
      isUnderline={isUnderline}
      setIsLinkEditMode={setIsLinkEditMode}
      setIsLink={setIsLink}
    />,
    anchorElem,
  );
}

export default function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
  setIsLinkEditMode,
}: {
  anchorElem?: HTMLElement;
  setIsLinkEditMode: Dispatch<boolean>;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(editor, anchorElem, setIsLinkEditMode);
}
