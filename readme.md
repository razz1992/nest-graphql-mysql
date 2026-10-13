# nest-graphql-mysql

NestJS GraphQL backend using TypeORM and MySQL. The project includes a multi-stage Dockerfile and an optional Terraform template for a disposable EC2 deployment in **`us-east-1`**.

## Run locally with Node.js

1. Install Node.js 22 and run `npm ci`.
2. Copy `.env.example` to a local environment file and configure database settings.
3. Run `npm run build`, then `npm run start:prod`.
4. Check `GET /health` and the GraphQL endpoint.

## Docker Compose with external MySQL

`docker-compose.yml` runs the API container only; MySQL remains on the external service. Setting `MYSQL_SSL_CA_PATH` enables TLS using the specified CA and rejects untrusted certificates. Never disable certificate verification for production connections.

For Aiven MySQL:

1. Download the Aiven CA certificate from the service connection page and save as `certs/mysql-ca.pem`.
2. Create `secrets/mysql_db_password` containing only the database password. Do not commit either file. Make the secret readable by container UID `10001`.
3. Create `.env.prod` with `NODE_ENV=production`, `PORT=8085`, and the MySQL host, port, username and database name. Do not put the password in this file.
4. Run `docker compose up --build -d`; verify `docker compose ps` and test the health endpoint.

Compose publishes port 8085 on all host interfaces by default. On EC2, the security group restricts access to your configured CIDR. Do not open MySQL port 3306 on the EC2 security group.

## Disposable EC2 + Terraform template

The `infra/` directory provisions a VPC, public subnet, routing, Internet Gateway, security group, SSM instance role, Elastic IP and an EC2 `t3.small` with an encrypted 8 GiB gp3 root volume. Administration uses Systems Manager Session Manager; this template doesn't open SSH or use the Jenkinsfile's hard-coded host or disabled host-key checking.

The deployment builds the image on EC2 from a selected repository ref. The external Aiven database is not provisioned or changed by Terraform. The password and CA PEM are retrieved from pre-created SSM parameters; their values are not placed in Terraform variables/state.

Follow [`infra/README.md`](infra/README.md) for prerequisites, parameter setup, Aiven allowlisting, deployment, testing, cost and teardown.

## Existing behaviour retained

TypeORM's `synchronize: true` is unchanged as requested. Review it before production. The existing Jenkinsfile is also unchanged; this Terraform flow does not use it.

## Seed data

The Excel seeding script is available as `npm run seed:excel`. Review `scripts/bulk-insert-from-excel.js` before running it against any non-test database.

## Security reminders

- Never commit `.env.prod`, database passwords, CA material or Terraform state.
- Keep TLS certificate verification enabled.
- Restrict port 8085 to a trusted client CIDR while testing.
- The `/health` endpoint currently checks process health only, not database readiness.


## GraphQL list pagination

The top-level `users` and `posts` list queries accept `limit` and `offset` arguments. Both default to `limit: 10` and `offset: 0`; limits must be from 1 through 100, and offsets must be non-negative integers. Results are ordered by ascending ID so offset pages have a deterministic order.

```graphql
query Users {
  users(limit: 10, offset: 20) {
    id
    name
    email
  }
}

query Posts {
  posts(limit: 10, offset: 20) {
    id
    title
  }
}
```

Single-record queries (`user(id: ...)` and `post(id: ...)`) are not paginated because they return one record. The nested `User.posts` list also accepts pagination arguments and continues to batch sibling user pages with DataLoader.

```graphql
query UsersWithPostPages {
  users(limit: 10, offset: 0) {
    id
    name
    posts(limit: 5, offset: 10) {
      id
      title
    }
  }
}
```

The `User.posts` loader applies each user's limit/offset in the database and batches pages for sibling users. All list pages use ascending IDs for deterministic ordering.
