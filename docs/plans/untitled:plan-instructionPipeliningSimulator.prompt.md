## Plan: Publish Repository With gh

I cannot run terminal commands from this planning session, so I prepared an execution-ready gh workflow you can run directly.

**Steps**
1. Check local publish state:
   gh auth status  
   git status -sb  
   git config remote.origin.url
2. Primary publish path:
   gh repo create instruction-pipelining-simulator --source=. --remote=origin --push
3. If the repo already exists on GitHub, use fallback:
   REPO_URL=$(gh repo view instruction-pipelining-simulator --json url -q .url)  
   git remote add origin "$REPO_URL" 2>/dev/null || git remote set-url origin "$REPO_URL"  
   git push -u origin "$(git rev-parse --abbrev-ref HEAD)"
4. Verify:
   gh repo view instruction-pipelining-simulator --json name,url,visibility  
   git remote -v

**What this covers**
- Creates GitHub repo named instruction-pipelining-simulator
- Ensures origin points to that repo
- Pushes current branch with upstream tracking
- Verifies remote and GitHub URL alignment
