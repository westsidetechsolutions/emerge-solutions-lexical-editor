import { create } from 'zustand'
import { EditorState } from 'lexical'

interface EditorStore {
  editorState: EditorState | null
  setEditorState: (state: EditorState) => void
}

export const useEditorStore = create<EditorStore>((set) => ({
  editorState: null,
  setEditorState: (state) => set({ editorState: state }),
})) 