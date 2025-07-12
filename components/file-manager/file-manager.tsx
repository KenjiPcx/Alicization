import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  FileTextIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
} from 'lucide-react';
import type { CompanyFile } from '@/lib/types';
import { FileUploadModal } from '@/components/file-manager/file-upload-modal';
import { fetcher } from '@/lib/utils';
import FileListItem from '@/components/file-manager/file-list-item';
import MultiSelectTags from './multi-select-tags';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

const FileManager: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for dropdown selections
  const [currentSortBy, setCurrentSortBy] = useState('Date Uploaded (Newest)');

  // State for applied filters
  const [appliedSortBy, setAppliedSortBy] = useState('Date Uploaded (Newest)');

  // Fetch files and tags
  const filesData = useQuery(api.companyFiles.getCompanyFiles, {
    employeeId: undefined,
  });
  const tags = useQuery(api.tags.getTags);

  const isLoadingFiles = !filesData;
  const isLoadingTags = !tags
  const isLoading = isLoadingFiles || isLoadingTags;

  const filteredAndSortedFiles = useMemo(() => {
    if (!filesData) return [];
    const processedFiles = [...filesData];

    // Apply tag filter
    // if (selectedTags.length > 0) {
    //   processedFiles = processedFiles.filter(
    //     (file) =>
    //       file.tags && selectedTags.some((tag) => file.tags?.includes(tag)),
    //   );
    // }

    // Apply sorting
    // Assuming file has: name: string, uploadedAt: Date, size: number
    switch (appliedSortBy) {
      case 'Date Uploaded (Newest)':
        processedFiles.sort(
          (a, b) =>
            new Date(b._creationTime).getTime() - new Date(a._creationTime).getTime(),
        );
        break;
      case 'Date Uploaded (Oldest)':
        processedFiles.sort(
          (a, b) =>
            new Date(a._creationTime).getTime() - new Date(b._creationTime).getTime(),
        );
        break;
      case 'Name (A-Z)':
        processedFiles.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Name (Z-A)':
        processedFiles.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'Size (Largest)':
        processedFiles.sort((a, b) => b.size - a.size);
        break;
      case 'Size (Smallest)':
        processedFiles.sort((a, b) => a.size - b.size);
        break;
      default:
        break;
    }

    return processedFiles;
  }, [filesData, appliedSortBy]);

  const paginatedFiles = useMemo(() => {
    if (!filteredAndSortedFiles) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedFiles, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    if (!filteredAndSortedFiles) return 1;
    return Math.ceil(filteredAndSortedFiles.length / itemsPerPage);
  }, [filteredAndSortedFiles, itemsPerPage]);

  const handleUploadSuccess = useCallback(
    (uploadedFileId: string) => {
      console.log('File uploaded successfully:', uploadedFileId);
      setShowUploadModal(false);
    },
    [],
  );

  const handleDeleteFile = useCallback(
    async (fileId: string) => {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        body: JSON.stringify({ id: fileId }),
      });
      const deletedFile = await response.json();
      console.log('Deleted file:', deletedFile);

      if (deletedFile) {
        // Refresh the files list
      } else {
        console.error('Error deleting file');
      }
    },
    [],
  );

  const handleApplyFilters = () => {
    setSelectedTags(selectedTags);
    setAppliedSortBy(currentSortBy);
    setCurrentPage(1); // Reset to first page when filters change
  };

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 ">
        <h1 className="text-2xl font-semibold">File Manager</h1>
        <Button onClick={() => setShowUploadModal(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Add File
        </Button>
      </div>

      {/* Filters and Sorters Placeholder */}
      <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label
              htmlFor="filter-taxonomy"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Filter by Tags
            </label>

            {/* <MultiSelectTags
              allTags={tags?.map((tag) => tag.name) || []}
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              isLoading={isLoadingTags}
              hasError={false}
              placeholder="Select tags to filter..."
            /> */}
          </div>
          <div>
            <label
              htmlFor="sort-by"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Sort by
            </label>
            <select
              id="sort-by"
              className="block w-full p-2 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
              value={currentSortBy}
              onChange={(e) => setCurrentSortBy(e.target.value)}
            >
              <option>Date Uploaded (Newest)</option>
              <option>Date Uploaded (Oldest)</option>
              <option>Name (A-Z)</option>
              <option>Name (Z-A)</option>
              <option>Size (Largest)</option>
              <option>Size (Smallest)</option>
            </select>
          </div>
          <Button
            variant="outline"
            className="w-full md:w-auto self-end"
            onClick={handleApplyFilters}
            disabled={isLoadingFiles}
          >
            <FilterIcon className="mr-2 h-4 w-4" /> Apply Filters
          </Button>
        </div>
      </div>

      <div className="w-full flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10 flex-grow flex flex-col justify-center items-center">
            <Loader2Icon className="w-12 h-12 mb-4 animate-spin text-gray-400 dark:text-gray-500" />
            <p className="text-xl font-semibold">Loading files...</p>
          </div>
        ) : filesData && filesData.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-10 flex-grow flex flex-col justify-center items-center">
            <FileTextIcon className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-xl font-semibold">No files uploaded yet.</p>
            <p>Click &quot;Add File&quot; to get started.</p>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto">
            <ul className="bg-white dark:bg-gray-800/30 shadow sm:rounded-md">
              {paginatedFiles.map((file) => (
                <FileListItem
                  key={file._id}
                  file={file}
                  onClick={() => {
                    console.log('File clicked:', file.name);
                  }}
                  onDelete={handleDeleteFile}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredAndSortedFiles && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeftIcon className="mr-2 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <FileUploadModal
        isOpen={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
};

export default FileManager;
