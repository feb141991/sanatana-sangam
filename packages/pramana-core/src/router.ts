import type { ModelAdapter, Policy, PramanaContract, RouteExecution } from './contracts';
import { runPolicies } from './policies';
import type { ResponseMetadata } from './types';

export type RouteDependencies<TInput, TContext = unknown> = {
  adapter: ModelAdapter;
  policies?: Array<Policy<TInput>>;
  contextBuilder?: {
    build(input: TInput): Promise<TContext> | TContext;
  };
};

function buildMetadata(task: string, result: { provider: string; modelUsed: string }): ResponseMetadata<string> {
  return {
    task,
    provider: result.provider,
    model: result.modelUsed,
    privateStackReady: false,
    usedHostedFallback: true,
  };
}

export function createPramanaRoute<TTask extends string, TInput, TOutput = unknown>(
  contract: PramanaContract<TTask, TInput, TOutput>,
  dependencies: RouteDependencies<TInput>,
) {
  return async function run(input: TInput): Promise<RouteExecution<TTask, TOutput>> {
    const meta = contract.buildRequestMetadata(input);

    contract.validateInput(input);
    await runPolicies(
      (dependencies.policies ?? []) as Array<Policy<TInput, TTask>>,
      input,
      meta,
    );

    if (dependencies.contextBuilder) {
      await dependencies.contextBuilder.build(input);
    }

    const prompt = contract.buildPrompt(input);
    const result = await dependencies.adapter.generate(prompt);

    return {
      task: contract.task,
      raw: result.text,
      output: contract.parseResult?.(result, input),
      metadata: buildMetadata(contract.task, result) as ResponseMetadata<TTask>,
    };
  };
}
