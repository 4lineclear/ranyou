alias i := install

client *ARGS: (npm "run dev" ARGS)
format *ARGS: (npm "run format" ARGS)
install *ARGS: (npm "i" ARGS)
npm *ARGS:
  cd client && npm {{ARGS}}

check *ARGS: (cargo "check" ARGS)
build *ARGS: (cargo "build" ARGS)
local *ARGS: (cargo "run --bin ranyou-core" ARGS)
cargo *ARGS:
  cd server && cargo {{ARGS}}

shuttle-local *ARGS: (shuttle ARGS)

shuttle *ARGS:
  cd server/shuttle && cargo shuttle {{ARGS}}
