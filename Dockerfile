FROM debian:buster

MAINTAINER theplatypus <nicolas.bloyet@see-d.fr>

USER root

# ---- install node and npm
RUN \
  apt-get update && \
  apt-get install -y apt-utils gnupg curl wget && \
  apt-get install -y libssl-dev libsasl2-dev

# install node & npm from apt
RUN apt-get -qq update
RUN apt-get install -y nodejs npm

# update to the latest stable node forever
RUN npm install -g n &&\
    n stable

# debian installs `node` as `nodejs`
RUN update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10

RUN \
    apt-get update && \
    apt-get install -y --force-yes r-base r-base-dev

# ---- RExpress
RUN mkdir /srv/RExpress
COPY . /srv/RExpress
WORKDIR /srv/RExpress

# install system-wide R packages
RUN \
    echo "install.packages(\"stringi\", repos=\"https://cran.rstudio.com\")" | R --no-save

RUN npm install
WORKDIR /srv/RExpress/lib
CMD ["sh", "-c", "npm start ${NB_WORKERS}"]

EXPOSE 80
