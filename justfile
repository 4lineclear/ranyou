export PATH := "./node_modules/.bin:" + env_var('PATH')

# alias i := install

# dev *ARGS: (run "dev" ARGS)
# format *ARGS: (run "format" ARGS)

# install *ARGS: (npm "i")

# run *ARGS: (npm "run" ARGS)
# npm *ARGS:
#     cd client && npm {{ARGS}}


# server *ARGS: (s-npm "run dev")
# type-check *ARGS: (run "type-check" ARGS)
# s-npm *ARGS:
#     cd server && npm {{ARGS}}

# "deploy": "wrangler deploy",
# "dev": "wrangler dev --test-scheduled",
# "start": "wrangler dev --test-scheduled",
# "cf-typegen": "wrangler types",
# "type-check": "wrangler types --experimental-include-runtime && tsc",
# "format": "prettier --write ."
