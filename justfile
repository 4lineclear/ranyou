alias i := install

client *ARGS: (run "dev" ARGS)
build-c *ARGS: (run "build" ARGS)
format *ARGS: (run "format" ARGS)
run *ARGS: (npm "run" ARGS)
install *ARGS: (npm "i" ARGS)
npm *ARGS:
  cd client && npm {{ARGS}}

tsc *ARGS:
  cd client && tsc {{ARGS}}

check *ARGS: (cargo "check" ARGS)
build *ARGS: (cargo "build" ARGS)
cargo *ARGS:
  cd server && cargo {{ARGS}}

local *ARGS: (shuttle "run" ARGS)
shuttle *ARGS:
  cd server/shuttle && cargo shuttle {{ARGS}}

test-prod:
  cd client && npm run build && \
  cd server && cargo shuttle run build --release
