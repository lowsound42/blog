---
title: "Mum, can we have CI/CD?"
date: 2026-03-15
lastmod: 2026-03-15
tags: ["programming", "tools"]
draft: false
author: "Omar"
description: "No, we have CI/CD at home"
---

I've been wanting to setup some sort of CI/CD pipeline on my home server. Oh yeah, I have a home server and I shoehorn it into every conversation I have IRL. It runs a bunch of services and I'll get into the whole thing in another post I'm sure. This one is focused on the most recent addition.

## How it's been getting done
This website is built using [Hugo](https://gohugo.io), a static site generator that's easy to use and super lightweight. The theme I'm using is [Papermod](https://github.com/adityatelange/hugo-PaperMod/). 

I work on the site on my machine by adding markdown files for the posts, custom js and css when required, and maybe some tweaks to the theme. It then gets commited and pushed to github where the github workflow file triggers actions that build the site and then deploy the built assets to github pages, pretty simple. All I did was follow this guide [here](https://gohugo.io/host-and-deploy/host-on-github-pages/) to set it up.

So I do stuff, commit it, push to the remote repository and a few minutes later it's been built and deployed to [lowsound.dev](https://lowsound.dev). Pretty great.

## So, what's new?

I wanted to do more with my home server. Here's what I did.

### Gitea

Run a [gitea](https://about.gitea.com) instance and use that as my source of truth. I've got a bunch of docker containers running all kinds of things, Gitea is the newest service I'm running (via docker compose). Here's what the compose file looks like:

```version: "3"

networks:
  gitea:
    external: false

services:
  server:
    image: gitea/gitea:latest
    container_name: gitea
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=db:${PG_PORT}
      - GITEA__database__NAME=${PG_USER}
      - GITEA__database__USER=${PG_DB_NAME}
      - GITEA__database__PASSWD=${PG_PASSWORD}
    restart: always
    networks:
      - gitea
    volumes:
      - ./gitea:/data
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "3001:3000"
      - "2221:22"
    depends_on:
      - db

  runner:
    image: gitea/act_runner:latest
    container_name: gitea-runner
    restart: always
    networks:
      - gitea
    depends_on:
      - server
    volumes:
      - ./runner:/data
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - GITEA_INSTANCE_URL=${INSTANCE_URL}
      - GITEA_RUNNER_REGISTRATION_TOKEN=${RUNNER_TOKEN}
      - GITEA_RUNNER_NAME=${RUNNER_NAME}

  db:
    image: docker.io/library/postgres:14
    restart: always
    environment:
      - POSTGRES_USER=${PG_USER}
      - POSTGRES_PASSWORD=${PG_PASSWORD}
      - POSTGRES_DB=${PG_DB_NAME}
      - PGPORT=${PG_PORT}
    networks:
      - gitea
    ports:
      - "${PG_PORT}:${PG_PORT}"
    volumes:
      - ./postgres:/var/lib/postgresql/data
```
There's a bunch of stuff happening here. First we need the `gitea` service. It depends on the `db` service. I decided to go with postgres but you could go with mysql, sqlite, or probably anything else.

There's also the `runner` service. This is essentially a docker container that spins up containers to run the `gitea actions` that I will define (thus the `/var/run/docker.sock:/var/run/docker.sock` line, it needs that to spin up containers). The token is generated in Gitea (via the runners settings tab). It's a chicken-and-egg kind of situation, I had to run the docker services without the runner, get the token, then alter the compose file, add the runner service, and restart the stack.

Here's what it looks like in the Gitea UI

{{<img runner.png "My Gitea runner">}}

This UI is accessible via the port I defined in the compose file (3001). I use nginx to proxy the request from a domain I own to the service (https://gitea.gobimax.com). Sorry, you won't be able to access it because the server that this is pointing to is hiding behind tailscale so only my devices can hit it.

### Build and Deploy

Okay, so now that that's running, in my Hugo project I define a `ci.yaml` file with the steps that the runner needs to iterate through. This is what that looks like:

```
name: Deploy Hugo to GitHub Pages
on:
  push:
    branches:
      - master
  workflow_dispatch:

jobs:
  semgrep:
    runs-on: ubuntu-latest
    steps:
      - uses: https://github.com/actions/checkout@v4
      - name: Run Semgrep
        run: |
          pip install --break-system-packages semgrep
          semgrep scan --config=auto --no-git-ignore .

  build-and-deploy:
    runs-on: ubuntu-latest
    env:
      HUGO_VERSION: 0.149.0
    steps:
      - name: Install Hugo
        run: |
          wget -O /tmp/hugo.deb https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb \
          && sudo dpkg -i /tmp/hugo.deb

      - uses: https://github.com/actions/checkout@v4
        with:
          submodules: recursive
          fetch-depth: 0

      - name: Build with Hugo
        env:
          HUGO_CACHEDIR: /tmp/hugo_cache
          HUGO_ENVIRONMENT: production
          TZ: America/Toronto
        run: |
          hugo --gc --minify --baseURL "https://www.lowsound.dev"

      - name: Deploy to GitHub Pages
        run: |
          git config --global user.email "gitea_runner@gobimax.com"
          git config --global user.name "Gitea CI"
          git clone --branch gh-pages --single-branch \
            https://${{ secrets.REPO_PAT }}@github.com/lowsound42/blog.git gh-pages-deploy
          cp -r public/* gh-pages-deploy/
          cd gh-pages-deploy
          git add -A
          git commit -m "deploy: ${{ gitea.sha }}" || echo "nothing to commit"
          git push
```

The first job uses a tool called [`semgrep`](https://github.com/semgrep/semgrep) to run a static code analysis, it's super cool. To be honest, there isn't _that_ much to analyze here, it's mostly markdown files. I have, however, added some custom pages with some custom javascript to this site. Mostly I just wanted to test out `semgrep` because I want to use it on another, bigger project that I'm working on so this is sort of a proof of concept for me.

After that is the Hugo build process, very similar to what I was running in my github actions.

Finally the deploy step. Essentially I am pushing the `public` folder that gets generated by the Hugo build to a new branch on github called `gh-pages`. In the old process, the github action would trigger the deployment, but now I've changed it to just serve the static assets from the `gh-pages` branch.

So, when I push to my `master` branch, I see this:
{{<img actions.png "My Gitea actions">}}

One of those runs looks like this:
{{<img action.png "The steps in an action">}}

### Fin

And...that's it. The build and deploy stuff isn't super complicated (that's kind of the nice thing about Hugo). The fun part is having a version control system that I self host and that runs my CI/CD pipelines for me. Granted, this one is super simple and doesn't do much more than run the Hugo build command and push to a github branch that my github page points to. Yes, there's the `semgrep` stuff but again, that's mostly for show for this project.

I'm excited to use this for bigger projects that have more complex build processes and that require actual static analysis.

Yet another Sunday occupied by working on this lovely little server.
