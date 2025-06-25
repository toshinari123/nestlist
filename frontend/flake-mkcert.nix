{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        python = pkgs.python311.withPackages (ps: with ps; [
          sslib
        ]);
      in
      {
        devShell = pkgs.mkShell {
              nativeBuildInputs = with pkgs; [
                pkg-config
		openssl
                mkcert
              ];
          packages = [
            python
          ];

  shellHook = ''
          echo "=== Starting frontend (this is shellhook in flake.nix) ==="
          echo "flake: generating certs..."
          mkcert -install
          mkcert localhost 127.0.0.1 ::1
          echo "flake: starting server..."
          python test.py
          trap "echo 'flake: cleaning up certs...' \ mkcert -uninstall" EXIT
        '';
        };
      }
    );
}
