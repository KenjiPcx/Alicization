import { memo } from 'react';
import { CrossIcon } from '../../icons';
import { Button } from '../../ui/button';
import { useMicroApp } from '@/hooks/use-micro-app';

function PureArtifactCloseButton() {
  const { closeMicroApp } = useMicroApp();

  return (
    <Button
      data-testid="artifact-close-button"
      variant="outline"
      className="h-fit p-2 dark:hover:bg-zinc-700"
      onClick={closeMicroApp}
    >
      <CrossIcon size={18} />
    </Button>
  );
}

export const ArtifactCloseButton = memo(PureArtifactCloseButton, () => true);
