# Authentigate documentation sourcecode

## Overview

This is **SK ID Solutions AS** service [Authentigate](https://www.skidsolutions.eu/services/authentigate/)  documentation sourcecode.

Page is hosted on [https://sk-eid.github.io/authentigate-documentation](https://sk-eid.github.io/authentigate-documentation/) and published via github action[build_deploy.yml](../.github/workflows/build_deploy.yml)

## Local

`cd` into `docs` directory and run:

    npm install
    npx antora --fetch antora-playbook.yml --stacktrace

Successful output looks like this:

    Site generation complete!
    Open file:///path/to/authentigate-documentation/docs/build/site/index.html in a browser to view your site.

