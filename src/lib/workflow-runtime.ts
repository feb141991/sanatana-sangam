export function shouldUseVercelWorkflowRuntime() {
  return Boolean(
    process.env.ENABLE_VERCEL_WORKFLOWS === 'true' ||
      process.env.ENABLE_WORKFLOW_LOCAL === 'true'
  );
}
