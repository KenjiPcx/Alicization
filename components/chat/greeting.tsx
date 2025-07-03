import { motion } from 'framer-motion';
import { getRandomEmployeeGreeting } from './employee-greetings';
import { useMemo } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { useOfficeStore } from '@/lib/store/office-store';

export const Greeting = () => {
  const { threadId } = useChatStore();
  const { activeParticipant } = useOfficeStore();
  const greeting = useMemo(() => getRandomEmployeeGreeting(), [threadId, activeParticipant]);

  return (
    <div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20 px-8 size-full flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-semibold"
      >
        Hello there!
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.6 }}
        className="text-2xl text-zinc-500"
      >
        {greeting}
      </motion.div>
    </div>
  );
};
