{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    rust-overlay.url = "github:oxalica/rust-overlay";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, rust-overlay, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };
        rustVersion = pkgs.rust-bin.stable."1.75.0".default.override {
          extensions = [ "rust-src" "rust-analyzer" ];
        };
        caddyConfig = self + "/config/Caddyfile";
      in
      {
      devShells = {
        backend = pkgs.mkShell {   # Accessed with `nix develop .#backend`
          nativeBuildInputs = with pkgs; [
            pkg-config
	    openssl
          ];
          buildInputs = [
            rustVersion
          ];

          # Environment variables
          RUST_SRC_PATH = "${rustVersion}/lib/rustlib/src/rust/library";
          #OPENSSL_LEGACY_PROVIDER = "1";
          #OPENSSL_CONF = builtins.readFile (self + "/config/openssl.cnf");
          ROCKET_PORT = 8001;

          shellHook = ''
            echo "=== Starting backend (this is shellhook in flake.nix) ==="
            cd backend && cargo run --features "local caddy"
          '';
        };

        caddy = pkgs.mkShell {    # Accessed with `nix develop .#caddy`
          buildInputs = with pkgs; [
            caddy
          ];

          shellHook = ''
            echo "=== Starting frontend (this is shellhook in flake.nix) ==="
            sudo caddy trust
            echo "flake: Starting Caddy localhost:3000"
            sudo caddy run --config ${caddyConfig} --adapter caddyfile &
            CADDY_PID=$!
            trap "kill $CADDY_PID" EXIT
          '';
        };
      };
    }
  );
}
