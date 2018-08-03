FROM node:8.10-alpine
RUN apk update
RUN apk add --no-cache git bash openssh-client zip python py-pip jq make gcc g++ libc-dev python-dev
RUN pip install --upgrade pip
RUN pip install awscli
WORKDIR /opt/code
RUN yarn global add jest-cli@19.0.2
