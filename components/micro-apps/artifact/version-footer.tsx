import { motion } from 'framer-motion';
import { useState } from 'react';
import { useWindowSize } from 'usehooks-ts';

import { LoaderIcon } from '../../icons';
import { Button } from '../../ui/button';
import type { Artifact } from '@/lib/types';

interface VersionFooterProps {
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  artifacts: Array<Artifact> | undefined;
  currentVersionIndex: number;
}

export const VersionFooter = ({
  handleVersionChange,
  artifacts,
}: VersionFooterProps) => {
  const { width } = useWindowSize();
  const isMobile = width < 768;

  // const { mutate } = useSWRConfig();
  const [isMutating, setIsMutating] = useState(false);

  if (!artifacts) return;

  return (
    <motion.div
      className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <div>
        <div>You are viewing a previous version</div>
        <div className="text-muted-foreground text-sm">
          Restore this version to make edits
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <Button
          disabled={isMutating}
          onClick={async () => {
            setIsMutating(true);

            // mutate(
            //   `/api/document?id=${artifact.documentId}`,
            //   await fetch(
            //     `/api/document?id=${artifact.documentId}&timestamp=${getDocumentTimestampByIndex(
            //       documents,
            //       currentVersionIndex,
            //     )}`,
            //     {
            //       method: 'DELETE',
            //     },
            //   ),
            //   {
            //     optimisticData: documents
            //       ? [
            //         ...documents.filter((document) =>
            //           isAfter(
            //             new Date(document.createdAt),
            //             new Date(
            //               getDocumentTimestampByIndex(
            //                 documents,
            //                 currentVersionIndex,
            //               ),
            //             ),
            //           ),
            //         ),
            //       ]
            //       : [],
            //   },
            // );
          }}
        >
          <div>Restore this version</div>
          {isMutating && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleVersionChange('latest');
          }}
        >
          Back to latest version
        </Button>
      </div>
    </motion.div>
  );
};
