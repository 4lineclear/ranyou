export PATH := "./node_modules/.bin:" + env_var('PATH')

alias i := install

client *ARGS: (npm "run dev" ARGS)

format *ARGS: (npm "run format" ARGS)

install *ARGS: (npm "i" ARGS)

npm *ARGS:
  cd client && npm {{ARGS}}
