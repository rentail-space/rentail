/**
 * This is a Checkly CLI ApiCheck construct. To learn more, visit:
 * - https://www.checklyhq.com/docs/cli/
 * - https://www.checklyhq.com/docs/cli/constructs-reference/#apicheck
 */

import {
  ApiCheck,
  AssertionBuilder,
  RetryStrategyBuilder,
} from "checkly/constructs";

new ApiCheck("rentail.api", {
  name: "api.index",
  shouldFail: false,
  runParallel: true,
  environmentVariables: [],
  maxResponseTime: 20000,
  degradedResponseTime: 10000,
  request: {
    url: "https://rentail.space",
    method: "GET",
    followRedirects: false,
    skipSSL: false,
    assertions: [
      AssertionBuilder.statusCode().equals(200),
      AssertionBuilder.responseTime().lessThan(20000),
    ],
    body: "",
    bodyType: "NONE",
    headers: [],
    queryParameters: [],
  },
  retryStrategy: RetryStrategyBuilder.fixedStrategy({
    baseBackoffSeconds: 0,
    maxRetries: 1,
    maxDurationSeconds: 600,
    sameRegion: false,
  }),
});
