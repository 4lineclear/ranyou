alias i := install
alias s := server
alias c := client
alias f := format

install *ARGS:
  bun i {{ARGS}}

server *ARGS:
  cd server && bun {{ARGS}}

client *ARGS:
  cd client && bun {{ARGS}}

format *ARGS:
  bun run format > /dev/null
