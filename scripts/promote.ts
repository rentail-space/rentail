#!/usr/bin/env tsx

/**
 * This script promotes the latest deployment to production.
 */

import { confirm } from "@inquirer/prompts";
import { Vercel } from "@vercel/sdk";
import type { GetDeploymentsResponseBody } from "@vercel/sdk/models/getdeploymentsop.js";
import dotenv from "dotenv";
import env from "env-var";
import { invariant } from "es-toolkit";
import { Octokit } from "octokit";
import ora from "ora";

dotenv.config();

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
    const status = "  %s\t%s =>\t%s";
    console.log(
      workflow.conclusion === "failure"
        ? `\x1b[31m✗ ${status}\x1b[0m`
        : `\x1b[32m✓ ${status}\x1b[0m`,
      new Date(workflow.created_at ?? 0).toLocaleString(),
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
    const status = "  %s\t%s => %s\t(%s) ";
    console.log(
      deployment.state === "READY"
        ? `\x1b[32m✓ ${status}\x1b[0m`
        : deployment.state === "BUILDING"
          ? `\x1b[33m⚡ ${status}\x1b[0m`
          : `\x1b[31m✗ ${status}\x1b[0m`,
      new Date(deployment.createdAt ?? 0).toLocaleString(),
      deployment.uid,
      deployment.target ?? "preview",
      deployment.readySubstate || "building…",
    );
  }
  console.log();
  return deployments[0];
}

async function promoteToProduction(
  deployment: GetDeploymentsResponseBody["deployments"][0],
) {
  console.log(
    `\x1b[34mPromoting deployment ${deployment.uid} to production...\x1b[0m`,
  );
  invariant(deployment.target === null, "Deployment is already in production");

  const { status } = await vercel.deployments.createDeployment({
    slug: deployment.name,
    teamId: vercelTeamId,
    requestBody: {
      deploymentId: deployment.uid,
      name: deployment.url,
      project: vercelProjectId,
      target: "production",
    },
  });
  console.log("\x1b[32m✔ Deployment promoted to production: %s\x1b[0m", status);
}

async function waitForDeploy(
  deployment: GetDeploymentsResponseBody["deployments"][0],
) {
  console.log("\x1b[34mWaiting for deployment to be ready...\x1b[0m");
  const spinner = ora().start();

  while (true) {
    const { status } = await vercel.deployments.getDeployment({
      idOrUrl: deployment.uid,
    });
    if (status === "READY") break;
    spinner.text = `${status}…`;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  spinner.succeed("Deployment is ready");
}

async function interactive() {
  // Review GitHub workflow status
  await githubWorkflows();
  // Review Vercel deployment status
  const deployment = await getRecentDeployment();

  if (deployment.readySubstate === "PROMOTED") {
    console.log("\x1b[32m✔ Deployment already promoted to production\x1b[0m");
  } else if (!deployment.readySubstate) {
    console.log("\x1b[32m✔ Promoting to production …\x1b[0m");
    await waitForDeploy(deployment);
  } else {
    const answer = await confirm({
      default: false,
      message: `Are you sure you want to promote deployment ${deployment.uid} to production?`,
    });
    if (answer) {
      await promoteToProduction(deployment);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await waitForDeploy(deployment);
    } else {
      console.log("\x1b[31m✘ Deployment not promoted to production\x1b[0m");
    }
  }
}

await interactive();
