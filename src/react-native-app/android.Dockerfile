# syntax=docker/dockerfile:1

# Copyright The OpenTelemetry Authors
# SPDX-License-Identifier: Apache-2.0

# https://github.com/react-native-community/docker-android
# Pick a tag whose Android build tools match what Expo's version catalog
# generates in android/build.gradle so the container doesn't re-download them.
FROM reactnativecommunity/react-native-android:v22.0@sha256:e817ea1959719c97c05adbc55348ebe21d286cec2caed1f18ad3c4b88c08cbf7 AS builder

WORKDIR /reactnativesrc/
COPY . .

RUN npm ci
RUN npm run lint
# Regenerate the android/ project from app.json using Expo's continuous native
# generation. `--no-install` skips a redundant install since dependencies are already present.
RUN npx expo prebuild --platform android --no-install
WORKDIR android/
RUN chmod +x gradlew
RUN ./gradlew -Dorg.gradle.jvmargs="-Xmx2g -XX:MaxMetaspaceSize=1g" assembleRelease

FROM scratch
COPY --from=builder /reactnativesrc/android/app/build/outputs/apk/release/app-release.apk /reactnativeapp.apk
ENTRYPOINT ["/reactnativeapp.apk"]
