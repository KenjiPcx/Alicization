import { defineSchema } from "convex/server";
import { usageTrackingTables } from "./usage_tracking/tables";
import { officeSystemTables } from "./office_system/tables";
import { officeObjectsTables } from "./office_objects/tables";
import { chatTables } from "./chat_system/tables";
import { knowledgeBaseTables } from "./knowledge_base/tables";
import { jobSystemTables } from "./job_system/tables";
import { userSystemTables } from "./user_system/tables";

export default defineSchema({
  ...usageTrackingTables,
  ...officeSystemTables,
  ...officeObjectsTables,
  ...chatTables,
  ...knowledgeBaseTables,
  ...jobSystemTables,
  ...userSystemTables,
});
