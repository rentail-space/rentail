#!/usr/bin/env tsx

/**
 * This script promotes the latest deployment to production.
 */

import { Vercel } from "@vercel/sdk";
import type { GetDeploymentsResponseBody } from "@vercel/sdk/models/getdeploymentsop.js";
import { invariant } from "es-toolkit";
import { execSync } from "node:child_process";

const vercelToken = "XfRm0eJrI7FPexiVLIztdb56";
const vercelTeamId = "team_bjyg9pgn8TQQVP2NLMPnSYSN";
const vercelProjectId = "prj_SrqYHd1Olo0XfxQHLe9lyGfcoT9z";
const vercel = new Vercel({
  bearerToken: vercelToken,
});

async function githubWorkflows() {
  console.log("\x1b[34mGitHub workflow status:\x1b[0m");
  const stdout = execSync(
    "gh run list --workflow deploy.yml --json conclusion,databaseId,displayTitle,event,name,number,status,createdAt,name,number,url,updatedAt --status completed --workflow Deploy --limit 10",
    { stdio: "pipe" },
  );
  const workflows = JSON.parse(stdout.toString()) as {
    conclusion: string;
    createdAt: string;
    databaseId: number;
    displayTitle: string;
  }[];
  for (const workflow of workflows) {
    const status = `  ${workflow.createdAt} ${workflow.displayTitle} => ${workflow.conclusion}`;
    console.log(
      workflow.conclusion === "failure"
        ? `\x1b[31m${status}\x1b[0m`
        : `\x1b[32m${status}\x1b[0m`,
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

  for (const deplopyment of deployments) {
    const status = `  ${new Date(deplopyment.createdAt ?? 0).toLocaleString()}\t${deplopyment.uid} => ${deplopyment.target ?? "preview"}\t(${deplopyment.readySubstate?.toLocaleLowerCase()}) `;
    console.log(
      deplopyment.state === "READY"
        ? `\x1b[32m${status}\x1b[0m`
        : `\x1b[31m${status}\x1b[0m`,
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

await githubWorkflows();
const deployment = await getRecentDeployment();
if (deployment.readySubstate === "PROMOTED")
  console.log("\x1b[32m✔ Deployment already promoted to production\x1b[0m");
else await promoteToProduction(deployment);
