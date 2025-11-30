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
import { execSync } from "node:child_process";
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

/**
 * Check if there are uncommitted changes in local git.
 * Exits with an error if there are uncommitted files.
 */
function checkIfUncommittedChanges() {
  const status = execSync("git status --porcelain").toString().trim();
  if (status.length > 0)
    console.error(
      "\x1b[31m\u26A0 You have uncommitted changes. Please commit or stash them before promoting.\x1b[0m",
    );
}

/**
 * Check if local Git is ahead of origin/main.
 * Exits with an error if there are commits ahead.
 */
function checkIfGitAhead() {
  // Fetch latest from origin
  execSync("git fetch origin main", { stdio: "ignore" });

  const ahead = execSync("git rev-list --left-right --count origin/main...HEAD")
    .toString()
    .trim()
    .split("\t")[1];

  if (ahead && Number(ahead) > 0)
    console.error(
      "\x1b[31m\u26A0 Local Git is ahead of origin/main. Please push your commits before promoting.\x1b[0m",
    );
}

async function githubWorkflows() {
  console.info("\x1b[34mGitHub workflow status:\x1b[0m");

  const { data } = await octokit.rest.actions.listWorkflowRuns({
    owner: "assaf",
    repo: "rentail",
    workflow_id: "deploy.yml",
  });
  for (const workflow of data.workflow_runs.slice(0, 5)) {
    const status = " %s \t(%s)\t%s => %s";
    console.info(
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
  console.info();
}

async function getRecentDeployment(): Promise<
  GetDeploymentsResponseBody["deployments"][0]
> {
  console.info("\x1b[34mVercel deployments:\x1b[0m");

  const { deployments } = await vercel.deployments.getDeployments({
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    limit: 5,
  });

  for (const deployment of deployments) {
    const status = " %s \t(%s)\t%s => %s";
    console.info(
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
  console.info();

  const mostRecentDeployment = deployments[0];
  return mostRecentDeployment;
}

async function promoteToProduction(
  deployment: GetDeploymentsResponseBody["deployments"][0],
): Promise<GetDeploymentResponseBody> {
  console.info(
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
  console.info("\x1b[34mWaiting for deployment to be ready...\x1b[0m");
  const spinner = ora().start();

  while (true) {
    const status = await vercel.deployments.getDeployment({ idOrUrl });
    const isPromoted =
      status.readySubstate === "PROMOTED" && status.target === "production";
    if (isPromoted) {
      spinner.succeed("Deployment is ready");
      console.info(
        "\nTry it out: \x1b[34mhttps://%s\x1b[0m\n",
        status.alias?.[0] ?? status.url,
      );
      return status;
    }

    spinner.text = `${status.readySubstate || status.readyState}…`;
  }
}

async function interactive() {
  // Check if local Git is ahead of origin/main
  checkIfUncommittedChanges();
  checkIfGitAhead();
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
    console.info("\nTry it out: \x1b[34mhttps://%s\x1b[0m\n", mostRecent.url);
    const shouldPromote = await confirm({
      default: false,
      message: `Promote deployment ${gitId} to production?`,
    });
    if (!shouldPromote) {
      console.info("\x1b[31m✘ Deployment not promoted to production\x1b[0m");
      return;
    }
    await promoteToProduction(mostRecent);
    return;
  }

  console.info("\x1b[34m⏳ Still building preview…\x1b[0m");
}

await interactive();
