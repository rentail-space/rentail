#!/bin/bash
# 
# List most recent workflow runs for the deploy.yml workflow
# List recent vercel deployments
gh run list --workflow deploy.yml --limit 5
vercel list --status BUILDING,READY
echo "Next step"
echo "  vercel promote -y"
