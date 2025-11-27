#!/usr/bin/env tsx

/**
 * This script promotes the latest deployment to production.
 */

import { confirm } from "@inquirer/prompts";
import { Vercel } from "@vercel/sdk";
import type { GetDeploymentResponseBody } from "@vercel/sdk/models/getdeploymentop.js";
import type { GetDeploymentsResponseBody } from "@vercel/sdk/models/getdeploymentsop.js";
import dotenv from "dotenv";
import env from "env-var";
import { invariant } from "es-toolkit";
import { Octokit } from "octokit";
import ora from "ora";

dotenv.config({ quiet: true });

const vercelTeamId = "team_bjyg9pgn8TQQVP2NLMPnSYSN";
const vercelProjectId = "prj_SrqYHd1Olo0XfxQHLe9lyGfcoT9z";

const vercel = new Vercel({
  bearerToken: env.get("VERCEL_TOKEN").required().asString(),
});
const octokit = new Octokit({
  auth: env.get("GITHUB_TOKEN").required().asString(),
});

async function githubWorkflows() {
  console.log("\x1b[34mGitHub workflow status:\x1b[0m");

  const { data } = await octokit.rest.actions.listWorkflowRuns({
    owner: "assaf",
    repo: "rentail",
    workflow_id: "deploy.yml",
  });
  for (const workflow of data.workflow_runs.slice(0, 5)) {
    const status = " %s \t(%s)\t%s => %s";
    console.log(
      workflow.conclusion === "failure"
        ? `\x1b[31m✗ ${status}\x1b[0m`
        : `\x1b[32m✓ ${status}\x1b[0m`,
      new Date(workflow.created_at ?? 0).toLocaleString(),
      workflow.head_commit?.id.slice(-8),
      workflow.display_title.slice(0, 40) +
        (workflow.display_title.length > 40 ? "…" : ""),
      workflow.conclusion ?? "building…",
    );
  }
  console.log();
}

async function getRecentDeployment(): Promise<
  GetDeploymentsResponseBody["deployments"][0]
> {
  console.log("\x1b[34mVercel deployments:\x1b[0m");

  const { deployments } = await vercel.deployments.getDeployments({
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    limit: 5,
  });

  for (const deployment of deployments) {
    const status = " %s \t(%s)\t%s => %s";
    console.log(
      deployment.state === "READY"
        ? `\x1b[32m✓ ${status}\x1b[0m`
        : deployment.state === "BUILDING"
          ? `\x1b[33m⚡${status}\x1b[0m`
          : `\x1b[31m✗ ${status}\x1b[0m`,
      new Date(deployment.createdAt ?? 0).toLocaleString(),
      deployment.meta?.githubCommitSha?.slice(-8),
      deployment.uid,
      deployment.target ?? "preview",
    );
  }
  console.log();

  const mostRecentDeployment = deployments[0];
  return mostRecentDeployment;
}

async function promoteToProduction(
  deployment: GetDeploymentsResponseBody["deployments"][0],
): Promise<GetDeploymentResponseBody> {
  console.log(
    `\x1b[34m⏳ Promoting deployment ${deployment.uid} to production...\x1b[0m`,
  );
  invariant(deployment.target === null, "Deployment is already in production");

  const { id } = await vercel.deployments.createDeployment({
    slug: deployment.name,
    teamId: vercelTeamId,
    requestBody: {
      deploymentId: deployment.uid,
      name: deployment.url,
      project: vercelProjectId,
      target: "production",
    },
  });
  return await waitForDeploy(id);
}

async function waitForDeploy(
  idOrUrl: string,
): Promise<GetDeploymentResponseBody> {
  console.log("\x1b[34mWaiting for deployment to be ready...\x1b[0m");
  const spinner = ora().start();

  while (true) {
    const status = await vercel.deployments.getDeployment({ idOrUrl });
    const isPromoted =
      status.readySubstate === "PROMOTED" && status.target === "production";
    if (isPromoted) {
      spinner.succeed("Deployment is ready");
      console.log(
        "\nTry it out: \x1b[34mhttps://%s\x1b[0m\n",
        status.alias?.[0] ?? status.url,
      );
      return status;
    }

    spinner.text = `${status.readySubstate || status.readyState}…`;
  }
}

async function interactive() {
  // Review GitHub workflow status
  await githubWorkflows();
  // Review Vercel deployment status
  const mostRecent = await getRecentDeployment();
  const isInProduction = mostRecent.target === "production";

  if (isInProduction) {
    await waitForDeploy(mostRecent.uid);
    return;
  }

  const isReady = mostRecent.readyState === "READY";
  if (isReady) {
    const gitId = mostRecent.meta?.githubCommitSha?.slice(-8);
    console.log("\nTry it out: \x1b[34mhttps://%s\x1b[0m\n", mostRecent.url);
    const shouldPromote = await confirm({
      default: false,
      message: `Promote deployment ${gitId} to production?`,
    });
    if (!shouldPromote) {
      console.log("\x1b[31m✘ Deployment not promoted to production\x1b[0m");
      return;
    }
    await promoteToProduction(mostRecent);
    return;
  }

  console.log("\x1b[34m⏳ Still building preview…\x1b[0m");
}

await interactive();
