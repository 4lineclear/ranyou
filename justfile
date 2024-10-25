export PATH := "./node_modules/.bin:" + env_var('PATH')

alias i := install

client *ARGS: (cnpm "run dev" ARGS)

cnpm *ARGS:
  cd client && npm {{ARGS}}

format *ARGS:
  npm run format {{ARGS}}

install *ARGS:
  npm i {{ARGS}}

build-lambda-api:
  cd ./crates/ranyou-api/ && \
  cargo lambda build --release --output-format zip

api-watch:
  cargo lambda watch

api-test:
  curl -X POST http://localhost:9000 \
    -H 'Content-Type: application/json' \
    -d '{"login":"my_login","password":"my_password"}'

deploy-lambda-api:
  aws lambda create-function \
    --function-name ranyou-api \
    --runtime provided.al2023 \
    --role arn:aws:iam::481665125796:role/ranyou-lambda \
    --handler rust.handler \
    --zip-file fileb://target/lambda/ranyou-api/bootstrap.zip
update-lambda-api:
  aws lambda update-function-code \
    --function-name ranyou-api \
    --zip-file fileb://target/lambda/ranyou-api/bootstrap.zip
