# Copyright The OpenTelemetry Authors
# SPDX-License-Identifier: Apache-2.0

FROM docker.io/library/python:3.15.0b3-slim-bookworm@sha256:e4408792d58d928261ed76a21a28daaf3339111e0f8cefb8f8c70b139ad94c39

WORKDIR /build

COPY ./src/recommendation/genproto/requirements.txt requirements.txt

RUN python -m pip install --no-cache-dir --require-hashes -r requirements.txt
