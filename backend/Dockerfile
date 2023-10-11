FROM rustlang/rust:nightly AS development

ENV USER=root
ENV ROCKET_ADDRESS=0.0.0.0
ENV ROCKET_ENV=development
ENV ROCKET_LOG_LEVEL=debug
ENV RUST_LOG=debug

WORKDIR /code
RUN cargo init
COPY Cargo.toml /code/Cargo.toml
COPY identity.pfx /code/identity.pfx
RUN cargo fetch
COPY . /code

EXPOSE 8000
EXPOSE 8002

CMD [ "cargo", "run", "--offline", "--release" ]
