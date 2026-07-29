export function shouldUseVercelWorkflowRuntime() {
  return Boolean(
    process.env.VERCEL_URL ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      process.env.ENABLE_VERCEL_WORKFLOWS === 'true' ||
      process.env.ENABLE_WORKFLOW_LOCAL === 'true'
  );
}

