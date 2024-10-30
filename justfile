alias i := install

client *ARGS: (npm "run dev" ARGS)
format *ARGS: (npm "run format" ARGS)
install *ARGS: (npm "i" ARGS)
npm *ARGS:
  cd client && npm {{ARGS}}

check *ARGS: (cargo "check" ARGS)
build *ARGS: (cargo "build" ARGS)
cargo *ARGS:
  cd server && cargo {{ARGS}}

local *ARGS: (shuttle "run" ARGS)
shuttle *ARGS:
  cd server/shuttle && cargo shuttle {{ARGS}}

