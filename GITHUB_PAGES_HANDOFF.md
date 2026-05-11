# GitHub Pages Handoff Guide

This repo is set up for a single purpose on GitHub Pages: host the web app only.

The current code already does the part we can safely do here:

- the web build is static and comes from `npm run build`
- the app uses a relative Vite base path, which is what you want for Pages
- no Pages deploy scripts are wired into this repo anymore, because the final hosting account has not been chosen yet

## What Account A can do now

1. Build the web app locally with `npm run build`.
2. Make sure the generated `dist/` folder looks correct.
3. Create or prepare the target repository name on the destination account if you already have access to it.
4. If you are going to transfer the repo later, keep the current repo clean and avoid adding account-specific deploy secrets here.

## What still needs Account B

1. Account B must own the final repository that will be public.
2. Account B must enable GitHub Pages in that repository.
3. Account B must choose the Pages source in GitHub settings, usually the `main` branch and the `/(root)` folder if you are publishing the built `dist/` output through a workflow.
4. Account B must publish the first successful Pages deployment.

## The short version of how Pages usually gets launched

Use this if you want the idiot-proof version.

1. Push the final web build files to the public repo.
2. Open the repo on GitHub.
3. Go to `Settings`.
4. Open `Pages`.
5. Pick the publishing source.
6. Save the setting.
7. Wait for GitHub to build and deploy the page.
8. Open the published URL and confirm the app loads.

## If the repo changes name

If the final repository name becomes `composer`, the published Pages URL will usually change too. That matters because:

- project pages include the repo name in the URL
- any links to the deployed site need the final repo name
- if you later move accounts, the final URL changes again

## What can be prepared before the account switch

- the app code
- the web build
- the README and handoff docs
- the favicon and other public assets
- the final repository name in package metadata

## What cannot be finished here

- actually enabling Pages on Account B
- selecting Account B as the owner of the public repo
- publishing under Account B without signing in or transferring the repository

## Recommended final sequence

1. Rename the repo and package to `composer`.
2. Build locally and confirm the web bundle works.
3. Transfer or mirror the repo into the destination account.
4. On the destination account, enable GitHub Pages.
5. Publish the first Pages deployment.
6. Only after that, update any public links that point to the deployed site.

## Notes for this project

- The desktop app is not part of GitHub Pages.
- Only the web app should be published there.
- The `Download Composer` button should point to the final release destination, not a draft Pages URL.