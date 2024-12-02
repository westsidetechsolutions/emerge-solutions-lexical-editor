/* eslint-disable */
// @ts-nocheck

import React, {useEffect, useState} from 'react';
import Button from '../../ui/Button';
import Modal from '../../ui/Modal';
import FileInput from '../../ui/FileInput';
import TextInput from '../../ui/TextInput';
import './AssetManager.css';
import { useAssetStore } from '../../stores/assetStore'

interface AssetManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: Asset) => void;
  mode: 'link' | 'image';
}

const FolderTreeItem = ({
  folder,
  level = 0,
  selectedFolderId,
  onFolderSelect,
  onFolderToggle,
  onFolderRename,
  onFolderDelete,
}: {
  folder: Folder;
  level?: number;
  selectedFolderId: string;
  onFolderSelect: (folder: Folder) => void;
  onFolderToggle: (folderId: string) => void;
  onFolderRename: (folderId: string, newName: string) => void;
  onFolderDelete: (folderId: string) => void;
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(folder.name);

  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFolderSelect(folder);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFolderToggle(folder.id);
  };

  const isFolderEmpty = (folder: Folder): boolean => {
    return folder.children.every((child) => {
      if ('children' in child) {
        return isFolderEmpty(child);
      }
      return false;  // If it's an asset, folder is not empty
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolderEmpty(folder)) {
      onFolderDelete(folder.id);
    }
  };

  return (
    <div style={{ paddingLeft: `${level * 16}px` }}>
      <div
        className={`flex items-center p-2 my-1 rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-100 border-l-4
          ${selectedFolderId === folder.id ? 'bg-blue-50 border-blue-500' : 
           level === 0 ? 'border-transparent' :
           level === 1 ? 'border-purple-300' :
           level === 2 ? 'border-pink-300' : 'border-gray-300'}`}
        onClick={handleFolderClick}
      >
        <div className="ml-2 flex items-center flex-1">
          <button
            className="text-purple-600 mr-2 text-base cursor-pointer p-1 hover:bg-purple-100 rounded"
            onClick={handleToggleClick}
            type="button"
          >
            {folder.children.some((child) => 'children' in child)
              ? folder.isExpanded
                ? '▾'
                : '▸'
              : ''}
          </button>

          {isRenaming ? (
            <div className="flex items-center flex-1" onClick={e => e.stopPropagation()}>
              <TextInput
                value={newName}
                onChange={(value) => setNewName(value)}
                onBlur={() => {
                  onFolderRename(folder.id, newName);
                  setIsRenaming(false);
                }}
                className="flex-1"
              />
              <button 
                className="ml-2 p-1 min-w-[32px] bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg"
                onClick={() => {
                  onFolderRename(folder.id, newName);
                  setIsRenaming(false);
                }}
              >
                ✓
              </button>
            </div>
          ) : (
            <div
              className="flex items-center flex-1"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
            >
              <span className="mr-2">📁</span>
              {folder.name}
            </div>
          )}

          {!isRenaming && folder.id !== 'root' && (
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-opacity duration-200"
              disabled={folder.children.length > 0}
              title={folder.children.length > 0 ? "Cannot delete non-empty folder" : "Delete folder"}
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {folder.isExpanded &&
        folder.children.map((childItem) => {
          if ('children' in childItem) {
            return (
              <FolderTreeItem
                key={childItem.id}
                folder={childItem}
                level={level + 1}
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
                onFolderToggle={onFolderToggle}
                onFolderRename={onFolderRename}
                onFolderDelete={onFolderDelete}
              />
            );
          }
          return null;
        })}
    </div>
  );
};

const AssetGridItem = ({
  item,
  onSelect,
  mode
}: {
  item: Asset;
  onSelect: (asset: Asset) => void;
  mode: 'link' | 'image';
}) => {
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    const storedUrl = sessionStorage.getItem(item.url)
    if (storedUrl) {
      setUrl(storedUrl)
    }
  }, [item.url])

  const isImage = item.type?.startsWith('image/')
  const isVideo = item.type?.startsWith('video/')
  const isDocument = !isImage && !isVideo

  const shouldShow = mode === 'link' ? true : (isImage || isVideo)

  if (!shouldShow) return null;

  return (
    <div className="relative group overflow-hidden rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200 h-40">
      {isImage && url && <img src={url} alt={item.name} className="w-full h-40 object-cover" />}
      {isVideo && url && <video src={url} className="w-full h-40 object-cover" />}
      {isDocument && (
        <div className="w-full h-40 flex items-center justify-center">
          <FilePreview type={item.type || ''} name={item.name} />
        </div>
      )}
      
      <div className="absolute inset-0 p-2 bg-white/95 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform duration-200 rounded-lg flex flex-col items-center justify-center">
        <div className="font-medium text-sm mb-4 text-gray-800 text-center break-words w-full">
          {item.name}
        </div>
        <button 
          className="w-2/3 py-1.5 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-colors duration-200"
          onClick={() => onSelect({...item, url})}
        >
          Select
        </button>
      </div>
    </div>
  );
};

const ACCEPTED_FILE_TYPES = {
  link: '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt',
  image: 'image/*,video/*'
};

const FilePreview = ({ type, name }: { type: string; name: string }) => {
  const getFileIcon = () => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('sheet') || type.includes('excel') || type.includes('csv')) return '📊';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📑';
    if (type.includes('text')) return '📃';
    return '📁';
  };

  const getFileColor = () => {
    if (type.includes('pdf')) return '#ff4433';
    if (type.includes('word') || type.includes('doc')) return '#2b579a';
    if (type.includes('sheet') || type.includes('excel')) return '#217346';
    if (type.includes('presentation') || type.includes('powerpoint')) return '#b7472a';
    if (type.includes('text')) return '#4a4a4a';
    return '#8f8f8f';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg">
      <div className="text-5xl mb-4 transform transition-transform duration-200 hover:scale-110" style={{ color: getFileColor() }}>
        {getFileIcon()}
      </div>
      <div className="text-center">
        <div className="font-medium text-sm text-gray-800 mb-1 line-clamp-2">{name}</div>
        <div className="text-xs text-gray-500 uppercase">{type.split('/')[1]?.toUpperCase() || 'DOCUMENT'}</div>
      </div>
    </div>
  );
};

export default function AssetManager({
  isOpen,
  onClose,
  onSelect,
  mode,
}: AssetManagerProps): JSX.Element {
  const { 
    tree, 
    currentFolder, 
    setCurrentFolder, 
    addFolder: addFolderToStore, 
    addAsset,
    deleteFolder,
    toggleFolder, 
    renameFolder 
  } = useAssetStore();
  const [newFolderName, setNewFolderName] = useState('');

  const handleAddFolder = () => {
    if (newFolderName.trim() === '') return;

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      children: [],
      isExpanded: false,
    };

    addFolderToStore(currentFolder.id, newFolder);
    setNewFolderName('');
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    const processFile = async (file: File): Promise<Asset> => {
      const id = `${Date.now()}-${file.name}`
      const reader = new FileReader()
      
      return new Promise((resolve) => {
        reader.onloadend = () => {
          const url = reader.result as string
          sessionStorage.setItem(`asset-${id}`, url)
          resolve({
            id,
            name: file.name,
            url: `asset-${id}`,
            type: file.type
          })
        }
        reader.readAsDataURL(file)
      })
    }

    const newAssets = await Promise.all(Array.from(files).map(processFile))
    newAssets.forEach(asset => {
      addAsset(currentFolder.id, asset)
    })
  }

  const handleClearStorage = () => {
    sessionStorage.clear();
    // Force a re-render of all asset items
    setCurrentFolder({ ...currentFolder });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-5xl">
      <div className="flex h-[600px]">
        {/* Folder Tree */}
        <div className="w-1/3 border-r border-gray-200 p-4">
          <div className="mb-4">
            <TextInput
              label="New Folder"
              value={newFolderName}
              onChange={(value) => setNewFolderName(value)}
              placeholder="Create new folder..."
              className="mb-2"
            />
            <button 
              onClick={handleAddFolder} 
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-colors duration-200"
            >
              Create Folder
            </button>
          </div>

          <FolderTreeItem
            folder={tree}
            selectedFolderId={currentFolder.id}
            onFolderSelect={setCurrentFolder}
            onFolderToggle={toggleFolder}
            onFolderRename={renameFolder}
            onFolderDelete={deleteFolder}
          />
        </div>

        {/* Asset Content */}
        <div className="w-2/3 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <FileInput
              className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-colors duration-200"
              label={
                <>
                  <i className="icon upload mr-2" />
                  Upload Files
                </>
              }
              onChange={handleFileUpload}
              accept={ACCEPTED_FILE_TYPES[mode]}
              multiple
            />
            <div className="flex gap-2 mt-2">
              <button 
                onClick={handleClearStorage}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Clear All Assets
              </button>
              <button 
                onClick={useAssetStore.getState().cleanupOrphanedAssets}
                className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Clean Up Orphaned Assets
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <div className="w-[720px]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {currentFolder.children.map((item) => {
                  if ('children' in item) {
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200"
                        onClick={() => setCurrentFolder(item)}
                      >
                        <span className="text-2xl">📁</span>
                        <span className="mt-2 text-sm font-medium text-gray-700">{item.name}</span>
                      </div>
                    );
                  } else {
                    return (
                      <AssetGridItem
                        key={item.id}
                        item={item}
                        onSelect={onSelect}
                        mode={mode}
                      />
                    );
                  }
                })}
                {currentFolder.children.length === 0 && (
                  <div className="col-span-full h-[450px] flex items-center justify-center text-gray-500">
                    No assets in this folder
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
