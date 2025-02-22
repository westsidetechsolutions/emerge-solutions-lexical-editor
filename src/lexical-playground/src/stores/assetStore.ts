import { create } from 'zustand'
import { persist, PersistStorage } from 'zustand/middleware'

export interface Asset {
  id: string
  name: string
  url: string
  type?: string
}

export interface Folder {
  id: string
  name: string
  children: Array<Folder | Asset>
  isExpanded?: boolean
}

const initialTree: Folder = {
  id: 'root',
  name: 'Root',
  children: [],
  isExpanded: true,
}

interface AssetState {
  tree: Folder
  currentFolder: Folder
  setTree: (tree: Folder) => void
  setCurrentFolder: (folder: Folder) => void
  addFolder: (parentId: string, newFolder: Folder) => void
  addAsset: (folderId: string, asset: Asset) => void
  toggleFolder: (folderId: string) => void
  renameFolder: (folderId: string, newName: string) => void
  deleteFolder: (folderId: string) => void
  cleanupOrphanedAssets: () => void
}

// Define StorageValue type
type StorageValue<T> = {
  state: T;
};

// Helper function to remove asset URLs from the tree
const removeAssetUrls = (folder: Folder): Folder => {
  return {
    ...folder,
    children: folder.children.map(child => {
      if ('children' in child) {
        return removeAssetUrls(child)
      }
      // For assets, store only metadata
      return {
        id: child.id,
        name: child.name,
        url: '' // Don't persist the URL
      }
    })
  }
}

// Create a custom storage that handles large assets
const createCustomStorage = (): PersistStorage<AssetState> => {
  return {
    getItem: (key: string) => {
      const value = localStorage.getItem(key)
      if (value) {
        return JSON.parse(value) as StorageValue<AssetState>
      }
      return null
    },
    setItem: (key: string, value: StorageValue<AssetState>) => {
      try {
        // Attempt to store the value as is
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e: any) {
        // If quota exceeded, try removing assets from the stored value
        if (e.name === 'QuotaExceededError') {
          try {
            const cleanTree = removeAssetUrls(value.state.tree)
            const cleanState: AssetState = {
              ...value.state,
              tree: cleanTree
            }
            localStorage.setItem(key, JSON.stringify({ state: cleanState }))
          } catch (parseError) {
            console.error('Failed to clean storage:', parseError)
          }
        } else {
          throw e
        }
      }
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key)
    },
  }
}

export const useAssetStore = create<AssetState>()(
  persist(
    (set) => ({
      tree: initialTree,
      currentFolder: initialTree,
      setTree: (tree) => set({ tree }),
      setCurrentFolder: (folder) => set({ currentFolder: folder }),
      addFolder: (parentId, newFolder) => 
        set((state) => {
          const updateFolderRecursively = (folder: Folder): Folder => {
            if (folder.id === parentId) {
              return {
                ...folder,
                children: [...folder.children, newFolder],
              }
            }
            return {
              ...folder,
              children: folder.children.map((child) =>
                'children' in child ? updateFolderRecursively(child) : child,
              ),
            }
          }
          const updatedTree = updateFolderRecursively(state.tree)
          return { 
            tree: updatedTree,
            currentFolder: state.currentFolder.id === parentId 
              ? { ...state.currentFolder, children: [...state.currentFolder.children, newFolder] }
              : state.currentFolder
          }
        }),
      addAsset: (folderId, asset) =>
        set((state) => {
          const updateFolderRecursively = (folder: Folder): Folder => {
            if (folder.id === folderId) {
              return {
                ...folder,
                children: [...folder.children, asset],
              }
            }
            return {
              ...folder,
              children: folder.children.map((child) =>
                'children' in child ? updateFolderRecursively(child) : child,
              ),
            }
          }
          const updatedTree = updateFolderRecursively(state.tree)
          return { 
            tree: updatedTree,
            currentFolder: state.currentFolder.id === folderId
              ? { ...state.currentFolder, children: [...state.currentFolder.children, asset] }
              : state.currentFolder
          }
        }),
      toggleFolder: (folderId) =>
        set((state) => {
          const toggleFolderRecursively = (folder: Folder): Folder => {
            if (folder.id === folderId) {
              return { ...folder, isExpanded: !folder.isExpanded }
            }
            return {
              ...folder,
              children: folder.children.map((child) =>
                'children' in child ? toggleFolderRecursively(child) : child,
              ),
            }
          }
          const updatedTree = toggleFolderRecursively(state.tree)
          return { tree: updatedTree }
        }),
      renameFolder: (folderId, newName) =>
        set((state) => {
          const renameFolderRecursively = (folder: Folder): Folder => {
            if (folder.id === folderId) {
              return { ...folder, name: newName }
            }
            return {
              ...folder,
              children: folder.children.map((child) =>
                'children' in child ? renameFolderRecursively(child) : child,
              ),
            }
          }
          const updatedTree = renameFolderRecursively(state.tree)
          return { tree: updatedTree }
        }),
      deleteFolder: (folderId) =>
        set((state) => {
          const deleteFolderRecursively = (folder: Folder): Folder => {
            return {
              ...folder,
              children: folder.children
                .filter((child) => 
                  'children' in child ? child.id !== folderId : true
                )
                .map((child) =>
                  'children' in child ? deleteFolderRecursively(child) : child
                ),
            };
          };
          const updatedTree = deleteFolderRecursively(state.tree);
          return { 
            tree: updatedTree,
            currentFolder: state.currentFolder.id === folderId 
              ? state.tree 
              : state.currentFolder
          };
        }),
      cleanupOrphanedAssets: () =>
        set((state) => {
          const cleanFolderRecursively = (folder: Folder): Folder => {
            return {
              ...folder,
              children: folder.children
                .filter((child) => {
                  if ('children' in child) {
                    return true;
                  }
                  // Check if the asset exists in sessionStorage
                  return sessionStorage.getItem(child.url) !== null;
                })
                .map((child) =>
                  'children' in child ? cleanFolderRecursively(child) : child
                ),
            };
          };
          const cleanedTree = cleanFolderRecursively(state.tree);
          return {
            tree: cleanedTree,
            currentFolder: cleanFolderRecursively(state.currentFolder)
          };
        }),
    }),
    {
      name: 'asset-storage',
      storage: createCustomStorage(),
    }
  )
) 