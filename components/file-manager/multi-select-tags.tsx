'use client';

import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@radix-ui/react-popover';
import {
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from 'cmdk';
import {
  ChevronsUpDownIcon,
  Badge,
  XIcon,
  Command,
  CheckIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';

interface MultiSelectTagsProps {
  allTags: string[] | undefined;
  selectedTags: string[];
  onChange: (selected: string[]) => void;
  isLoading?: boolean;
  hasError?: boolean;
  placeholder?: string;
  className?: string;
}

const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  allTags = [],
  selectedTags,
  onChange,
  isLoading,
  hasError,
  placeholder = 'Select tags...',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (tag: string) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onChange(newSelectedTags);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const triggerText = () => {
    if (isLoading) return 'Loading tags...';
    if (hasError) return 'Error loading tags';
    if (selectedTags.length === 0) return placeholder;
    return null; // Badges will be shown
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-start text-left font-normal h-10 px-3 py-2 text-sm',
            'border border-gray-300 dark:border-gray-600 rounded-md shadow-sm',
            'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
            'focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
            !selectedTags.length && 'text-gray-500 dark:text-gray-400',
            className,
          )}
          disabled={isLoading || hasError}
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center w-full">
            <ChevronsUpDownIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <div className="flex flex-wrap gap-1 items-center flex-grow">
              {selectedTags.length > 0
                ? selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      className="mr-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(tag);
                      }}
                    >
                      {tag}
                      <XIcon className="ml-1 h-3 w-3 cursor-pointer" />
                    </Badge>
                  ))
                : triggerText() && (
                    <span className="truncate">{triggerText()}</span>
                  )}
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading
                ? 'Loading...'
                : hasError
                  ? 'Error fetching tags'
                  : 'No tags found.'}
            </CommandEmpty>
            <CommandGroup>
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag}
                  value={tag}
                  onSelect={() => {
                    handleSelect(tag);
                    // Optionally keep popover open: setOpen(true);
                  }}
                >
                  <CheckIcon
                    className={`mr-2 h-4 w-4 ${
                      selectedTags.includes(tag) ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                  {tag}
                </CommandItem>
              ))}
            </CommandGroup>
            {selectedTags.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])} // Clear all
                    className="justify-center text-center text-sm text-muted-foreground cursor-pointer"
                  >
                    Clear selected tags
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelectTags;
