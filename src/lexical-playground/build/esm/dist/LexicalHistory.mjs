/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mergeRegister } from '@lexical/utils';
import { UNDO_COMMAND, COMMAND_PRIORITY_EDITOR, REDO_COMMAND, CLEAR_EDITOR_COMMAND, CLEAR_HISTORY_COMMAND, CAN_REDO_COMMAND, CAN_UNDO_COMMAND, $isRangeSelection, $isTextNode, $isRootNode } from 'lexical';

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

const HISTORY_MERGE = 0;
const HISTORY_PUSH = 1;
const DISCARD_HISTORY_CANDIDATE = 2;
const OTHER = 0;
const COMPOSING_CHARACTER = 1;
const INSERT_CHARACTER_AFTER_SELECTION = 2;
const DELETE_CHARACTER_BEFORE_SELECTION = 3;
const DELETE_CHARACTER_AFTER_SELECTION = 4;
function getDirtyNodes(editorState, dirtyLeaves, dirtyElements) {
  const nodeMap = editorState._nodeMap;
  const nodes = [];
  for (const dirtyLeafKey of dirtyLeaves) {
    const dirtyLeaf = nodeMap.get(dirtyLeafKey);
    if (dirtyLeaf !== undefined) {
      nodes.push(dirtyLeaf);
    }
  }
  for (const [dirtyElementKey, intentionallyMarkedAsDirty] of dirtyElements) {
    if (!intentionallyMarkedAsDirty) {
      continue;
    }
    const dirtyElement = nodeMap.get(dirtyElementKey);
    if (dirtyElement !== undefined && !$isRootNode(dirtyElement)) {
      nodes.push(dirtyElement);
    }
  }
  return nodes;
}
function getChangeType(prevEditorState, nextEditorState, dirtyLeavesSet, dirtyElementsSet, isComposing) {
  if (prevEditorState === null || dirtyLeavesSet.size === 0 && dirtyElementsSet.size === 0 && !isComposing) {
    return OTHER;
  }
  const nextSelection = nextEditorState._selection;
  const prevSelection = prevEditorState._selection;
  if (isComposing) {
    return COMPOSING_CHARACTER;
  }
  if (!$isRangeSelection(nextSelection) || !$isRangeSelection(prevSelection) || !prevSelection.isCollapsed() || !nextSelection.isCollapsed()) {
    return OTHER;
  }
  const dirtyNodes = getDirtyNodes(nextEditorState, dirtyLeavesSet, dirtyElementsSet);
  if (dirtyNodes.length === 0) {
    return OTHER;
  }

  // Catching the case when inserting new text node into an element (e.g. first char in paragraph/list),
  // or after existing node.
  if (dirtyNodes.length > 1) {
    const nextNodeMap = nextEditorState._nodeMap;
    const nextAnchorNode = nextNodeMap.get(nextSelection.anchor.key);
    const prevAnchorNode = nextNodeMap.get(prevSelection.anchor.key);
    if (nextAnchorNode && prevAnchorNode && !prevEditorState._nodeMap.has(nextAnchorNode.__key) && $isTextNode(nextAnchorNode) && nextAnchorNode.__text.length === 1 && nextSelection.anchor.offset === 1) {
      return INSERT_CHARACTER_AFTER_SELECTION;
    }
    return OTHER;
  }
  const nextDirtyNode = dirtyNodes[0];
  const prevDirtyNode = prevEditorState._nodeMap.get(nextDirtyNode.__key);
  if (!$isTextNode(prevDirtyNode) || !$isTextNode(nextDirtyNode) || prevDirtyNode.__mode !== nextDirtyNode.__mode) {
    return OTHER;
  }
  const prevText = prevDirtyNode.__text;
  const nextText = nextDirtyNode.__text;
  if (prevText === nextText) {
    return OTHER;
  }
  const nextAnchor = nextSelection.anchor;
  const prevAnchor = prevSelection.anchor;
  if (nextAnchor.key !== prevAnchor.key || nextAnchor.type !== 'text') {
    return OTHER;
  }
  const nextAnchorOffset = nextAnchor.offset;
  const prevAnchorOffset = prevAnchor.offset;
  const textDiff = nextText.length - prevText.length;
  if (textDiff === 1 && prevAnchorOffset === nextAnchorOffset - 1) {
    return INSERT_CHARACTER_AFTER_SELECTION;
  }
  if (textDiff === -1 && prevAnchorOffset === nextAnchorOffset + 1) {
    return DELETE_CHARACTER_BEFORE_SELECTION;
  }
  if (textDiff === -1 && prevAnchorOffset === nextAnchorOffset) {
    return DELETE_CHARACTER_AFTER_SELECTION;
  }
  return OTHER;
}
function isTextNodeUnchanged(key, prevEditorState, nextEditorState) {
  const prevNode = prevEditorState._nodeMap.get(key);
  const nextNode = nextEditorState._nodeMap.get(key);
  const prevSelection = prevEditorState._selection;
  const nextSelection = nextEditorState._selection;
  const isDeletingLine = $isRangeSelection(prevSelection) && $isRangeSelection(nextSelection) && prevSelection.anchor.type === 'element' && prevSelection.focus.type === 'element' && nextSelection.anchor.type === 'text' && nextSelection.focus.type === 'text';
  if (!isDeletingLine && $isTextNode(prevNode) && $isTextNode(nextNode) && prevNode.__parent === nextNode.__parent) {
    // This has the assumption that object key order won't change if the
    // content did not change, which should normally be safe given
    // the manner in which nodes and exportJSON are typically implemented.
    return JSON.stringify(prevEditorState.read(() => prevNode.exportJSON())) === JSON.stringify(nextEditorState.read(() => nextNode.exportJSON()));
  }
  return false;
}
function createMergeActionGetter(editor, delay) {
  let prevChangeTime = Date.now();
  let prevChangeType = OTHER;
  return (prevEditorState, nextEditorState, currentHistoryEntry, dirtyLeaves, dirtyElements, tags) => {
    const changeTime = Date.now();

    // If applying changes from history stack there's no need
    // to run history logic again, as history entries already calculated
    if (tags.has('historic')) {
      prevChangeType = OTHER;
      prevChangeTime = changeTime;
      return DISCARD_HISTORY_CANDIDATE;
    }
    const changeType = getChangeType(prevEditorState, nextEditorState, dirtyLeaves, dirtyElements, editor.isComposing());
    const mergeAction = (() => {
      const isSameEditor = currentHistoryEntry === null || currentHistoryEntry.editor === editor;
      const shouldPushHistory = tags.has('history-push');
      const shouldMergeHistory = !shouldPushHistory && isSameEditor && tags.has('history-merge');
      if (shouldMergeHistory) {
        return HISTORY_MERGE;
      }
      if (prevEditorState === null) {
        return HISTORY_PUSH;
      }
      const selection = nextEditorState._selection;
      const hasDirtyNodes = dirtyLeaves.size > 0 || dirtyElements.size > 0;
      if (!hasDirtyNodes) {
        if (selection !== null) {
          return HISTORY_MERGE;
        }
        return DISCARD_HISTORY_CANDIDATE;
      }
      if (shouldPushHistory === false && changeType !== OTHER && changeType === prevChangeType && changeTime < prevChangeTime + delay && isSameEditor) {
        return HISTORY_MERGE;
      }

      // A single node might have been marked as dirty, but not have changed
      // due to some node transform reverting the change.
      if (dirtyLeaves.size === 1) {
        const dirtyLeafKey = Array.from(dirtyLeaves)[0];
        if (isTextNodeUnchanged(dirtyLeafKey, prevEditorState, nextEditorState)) {
          return HISTORY_MERGE;
        }
      }
      return HISTORY_PUSH;
    })();
    prevChangeTime = changeTime;
    prevChangeType = changeType;
    return mergeAction;
  };
}
function redo(editor, historyState) {
  const redoStack = historyState.redoStack;
  const undoStack = historyState.undoStack;
  if (redoStack.length !== 0) {
    const current = historyState.current;
    if (current !== null) {
      undoStack.push(current);
      editor.dispatchCommand(CAN_UNDO_COMMAND, true);
    }
    const historyStateEntry = redoStack.pop();
    if (redoStack.length === 0) {
      editor.dispatchCommand(CAN_REDO_COMMAND, false);
    }
    historyState.current = historyStateEntry || null;
    if (historyStateEntry) {
      historyStateEntry.editor.setEditorState(historyStateEntry.editorState, {
        tag: 'historic'
      });
    }
  }
}
function undo(editor, historyState) {
  const redoStack = historyState.redoStack;
  const undoStack = historyState.undoStack;
  const undoStackLength = undoStack.length;
  if (undoStackLength !== 0) {
    const current = historyState.current;
    const historyStateEntry = undoStack.pop();
    if (current !== null) {
      redoStack.push(current);
      editor.dispatchCommand(CAN_REDO_COMMAND, true);
    }
    if (undoStack.length === 0) {
      editor.dispatchCommand(CAN_UNDO_COMMAND, false);
    }
    historyState.current = historyStateEntry || null;
    if (historyStateEntry) {
      historyStateEntry.editor.setEditorState(historyStateEntry.editorState, {
        tag: 'historic'
      });
    }
  }
}
function clearHistory(historyState) {
  historyState.undoStack = [];
  historyState.redoStack = [];
  historyState.current = null;
}

/**
 * Registers necessary listeners to manage undo/redo history stack and related editor commands.
 * It returns `unregister` callback that cleans up all listeners and should be called on editor unmount.
 * @param editor - The lexical editor.
 * @param historyState - The history state, containing the current state and the undo/redo stack.
 * @param delay - The time (in milliseconds) the editor should delay generating a new history stack,
 * instead of merging the current changes with the current stack.
 * @returns The listeners cleanup callback function.
 */
function registerHistory(editor, historyState, delay) {
  const getMergeAction = createMergeActionGetter(editor, delay);
  const applyChange = ({
    editorState,
    prevEditorState,
    dirtyLeaves,
    dirtyElements,
    tags
  }) => {
    const current = historyState.current;
    const redoStack = historyState.redoStack;
    const undoStack = historyState.undoStack;
    const currentEditorState = current === null ? null : current.editorState;
    if (current !== null && editorState === currentEditorState) {
      return;
    }
    const mergeAction = getMergeAction(prevEditorState, editorState, current, dirtyLeaves, dirtyElements, tags);
    if (mergeAction === HISTORY_PUSH) {
      if (redoStack.length !== 0) {
        historyState.redoStack = [];
        editor.dispatchCommand(CAN_REDO_COMMAND, false);
      }
      if (current !== null) {
        undoStack.push({
          ...current
        });
        editor.dispatchCommand(CAN_UNDO_COMMAND, true);
      }
    } else if (mergeAction === DISCARD_HISTORY_CANDIDATE) {
      return;
    }

    // Else we merge
    historyState.current = {
      editor,
      editorState
    };
  };
  const unregister = mergeRegister(editor.registerCommand(UNDO_COMMAND, () => {
    undo(editor, historyState);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(REDO_COMMAND, () => {
    redo(editor, historyState);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(CLEAR_EDITOR_COMMAND, () => {
    clearHistory(historyState);
    return false;
  }, COMMAND_PRIORITY_EDITOR), editor.registerCommand(CLEAR_HISTORY_COMMAND, () => {
    clearHistory(historyState);
    editor.dispatchCommand(CAN_REDO_COMMAND, false);
    editor.dispatchCommand(CAN_UNDO_COMMAND, false);
    return true;
  }, COMMAND_PRIORITY_EDITOR), editor.registerUpdateListener(applyChange));
  return unregister;
}

/**
 * Creates an empty history state.
 * @returns - The empty history state, as an object.
 */
function createEmptyHistoryState() {
  return {
    current: null,
    redoStack: [],
    undoStack: []
  };
}

export { createEmptyHistoryState, registerHistory };
