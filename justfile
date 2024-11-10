alias i := install
alias s := server
alias c := client

install *ARGS:
  bun i {{ARGS}}

server *ARGS:
  cd server && bun {{ARGS}}

client *ARGS:
  cd client && bun {{ARGS}}
