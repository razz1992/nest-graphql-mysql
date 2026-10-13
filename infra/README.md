# Terraform deployment guide

This guide explains how a developer can validate, plan, create, verify, update, and safely remove the disposable EC2 deployment for `nest-graphql-mysql`.

> **Scope and safety:** This Terraform configuration is deliberately restricted to **AWS `us-east-1`**. It creates a test deployment; the application database is an external Aiven MySQL service. It does not create or migrate the database. Read the plan before every apply, especially when managing an existing deployment.

## Quick start

Use this flow for a **new, isolated test deployment** after completing the prerequisites and configuration steps below.

From the repository root, run the following in PowerShell on Windows:

```powershell
Set-Location .\infra

# Confirm you are using the intended AWS identity and region.
$env:AWS_REGION = "us-east-1"
$env:AWS_DEFAULT_REGION = "us-east-1"
aws sts get-caller-identity

# Create your private local variable file and edit it.
Copy-Item .\terraform.tfvars.example .\terraform.tfvars
notepad .\terraform.tfvars

# Format, initialize the provider, and validate the configuration.
terraform fmt -recursive
terraform init
terraform validate

# Save and inspect a plan before applying it.
terraform plan -input=false -no-color -var-file="terraform.tfvars" -out="deployment.tfplan"
terraform show -no-color .\deployment.tfplan

# Run only after reviewing the plan and completing the checklist below.
terraform apply -input=false .\deployment.tfplan
```

Do not skip the plan review. A successful `terraform validate` confirms the configuration is valid; it does **not** confirm that the proposed AWS changes are safe or that credentials, SSM parameters, network access, or the database are ready.

## What this deployment creates

- Amazon Linux 2023 x86-64 EC2 instance, default type `t3.small` (2 vCPU, 2 GiB RAM).
- Encrypted gp3 root EBS volume, default 8 GiB; deleted with the instance.
- Dedicated VPC, public subnet, route table, Internet Gateway, security group, and Elastic IP.
- EC2 IAM role and instance profile for Systems Manager Session Manager and read access to the two configured SSM parameters.
- Docker, Docker Compose, Buildx, and the application container on the instance.

The app listens on TCP port `8085`. The security group permits inbound access only from `allowed_cidr`; it does not open SSH or MySQL. The application connects to external Aiven MySQL using TLS with CA certificate verification.

This template does **not** provision a NAT Gateway, load balancer, RDS, ECR, EKS, or CloudWatch log group. The health endpoint is plain HTTP and checks process health only; it is not a production TLS termination design or a database-readiness check.

## 1. Prerequisites

Install or have access to:

- Terraform **1.6.0 or newer**.
- AWS CLI v2.
- Git and, on a workstation where you want to use Session Manager, the AWS Session Manager plugin.
- An AWS identity authorized to create EC2, VPC/networking, Elastic IP and IAM role/instance-profile resources, pass the EC2 role, and use Systems Manager Parameter Store. Follow your organization's least-privilege access process.
- An existing Aiven MySQL service, its database name, user, password, and CA PEM certificate.
- Your current public IPv4 address. Use a single-address CIDR such as `198.51.100.25/32` as a format example; replace it with your actual public IP.

Prefer an approved IAM role or IAM Identity Center/SSO profile. Do not use AWS root credentials for routine deployments, and never place access keys or database passwords in Git.

### Select and verify the AWS identity

For example, if your approved CLI profile is named `nest-graphql-mysql-test`:

```powershell
aws configure --profile nest-graphql-mysql-test
$env:AWS_PROFILE = "nest-graphql-mysql-test"
$env:AWS_REGION = "us-east-1"
$env:AWS_DEFAULT_REGION = "us-east-1"

aws sts get-caller-identity
aws configure list
```

If your organization uses IAM Identity Center, use its approved SSO setup and login flow instead of entering long-lived access keys. Verify the returned account and identity before creating resources.

The provider configuration takes its region from `var.aws_region`, which defaults to `us-east-1` and is validated in `variables.tf`. Keep that value unchanged for this deployment.

## 2. Prepare the database and SSM parameters

### Confirm the Aiven database

The default database name is `graphql_demo`. It must already exist on the configured Aiven service, with the expected `user` and `post` tables and any test data you need. Terraform does not create `graphql_demo`, rename `defaultdb`, or migrate records. Update `mysql_db_name` in your local `terraform.tfvars` if your intended existing database has another name.

### Create the two SSM parameters manually

In **AWS Systems Manager → Parameter Store**, select region **us-east-1** and create these parameters in the same AWS account that will run the deployment:

| Parameter name (default prefix) | Type | Value |
|---|---|---|
| `/nest-graphql-mysql/test/mysql-password` | `SecureString` | Aiven MySQL password |
| `/nest-graphql-mysql/test/mysql-ca-pem` | `String` | Full PEM contents of the Aiven CA certificate |

Use the AWS-managed SSM encryption key for the default configuration. A customer-managed KMS key requires carefully scoped `kms:Decrypt` permissions for the EC2 role and should be reviewed separately.

These parameters are pre-created inputs, not Terraform-managed resources. The Terraform instance role is scoped to read their parameter ARNs. The password and CA contents are fetched by the instance bootstrap; they are not Terraform input variables. Never paste the password into source files, commit the parameter values, or print the generated password file in logs.

If you choose a different environment or parameter prefix, update `ssm_parameter_prefix` and create both matching parameter names before applying.

## 3. Configure local variables

From the `infra/` directory:

```powershell
Copy-Item .\terraform.tfvars.example .\terraform.tfvars
notepad .\terraform.tfvars
```

At minimum, change:

- `allowed_cidr`: replace the example documentation IP with your current public IPv4 CIDR, normally `x.x.x.x/32`. Otherwise your workstation will not be allowed to reach port 8085.
- `repository_ref`: for repeatable deployments, use a full Git commit SHA. The example uses `main`, which moves as commits are added.
- `mysql_db_name`: use the database that already exists in Aiven (default `graphql_demo`).
- Database connection values and `ssm_parameter_prefix` when your Aiven service or environment is different.

The example file lists the available/common overrides. Remaining resource defaults are in `variables.tf`. Do not commit `terraform.tfvars`; it is intentionally ignored by Git.

## 4. Format, initialize, and validate

Run these from `infra/`:

```powershell
terraform fmt -recursive
terraform init
terraform validate
```

What each command does:

- `terraform fmt -recursive`: formats Terraform files in this directory tree.
- `terraform init`: installs the required provider and initializes the working directory. The checked-in `.terraform.lock.hcl` records the selected AWS provider version/checksums. Commit intentional lock-file updates; do not commit the generated `.terraform/` directory.
- `terraform validate`: checks Terraform configuration syntax and internal consistency. It does not create AWS resources.

If Terraform reports that the AWS provider is missing, run `terraform init` before retrying validation. Use `terraform init -upgrade` only when you intentionally want to reconsider provider versions; inspect and commit the lock-file change afterward.

## 5. Create and review a saved plan

Generate a plan file:

```powershell
terraform plan -input=false -no-color -var-file="terraform.tfvars" -out="deployment.tfplan"
terraform show -no-color .\deployment.tfplan
```

Read the full plan before applying. For a new, isolated deployment, the expected action is to create the resources described above. Check the account, region, resource names, CIDRs, instance type, database settings, ingress CIDR, and whether any resources are being replaced or destroyed.

### Important: state and existing deployments

This repository currently uses **local Terraform state**; it does not configure a remote backend. The state file is normally `infra/terraform.tfstate`, and it is intentionally ignored by Git. It is required for Terraform to know which real resources it manages.

- If you previously created the infrastructure from this same working directory, keep the corresponding state file and its backups safe. Do not delete it or replace it with a fresh empty working directory when you want to manage the same deployment.
- A developer who clones the repository without the original state does **not** automatically gain management of an existing EC2/VPC deployment. A plan may propose new resources even when similar resources already exist in AWS.
- If the deployment already exists but the state is missing, stop. Do not apply a plan that might create duplicates or conflict with existing IAM names. Recover the correct state securely or arrange a reviewed Terraform import/state migration before proceeding.
- For a separate, parallel test deployment in the same AWS account, choose a unique `project_name` and `environment_name`, a matching unique `ssm_parameter_prefix`, and non-overlapping VPC/subnet CIDRs. Use a separate working directory/state for that deployment. The SSM parameters and Aiven allowlist must also match the new configuration.

**Do not commit state files to Git or send them through chat.** State can contain infrastructure details and may contain sensitive values.

### Stop conditions — do not apply yet

Do not apply the plan until you understand every replacement and deletion. Stop and review if:

- Terraform proposes destroying an existing EC2 instance, VPC, IAM role, EIP, or other resource you intend to keep.
- The plan includes `-/+`, says `must be replaced`, or has unexpected resource counts.
- The plan wants to replace the EC2 instance after a change to `user_data` or one of the values rendered into it.

In `main.tf`, `user_data_replace_on_change = true`. Therefore changing the bootstrap template or its rendered inputs can require EC2 replacement. For a running deployment, that can cause downtime and must be planned intentionally. Do not blindly apply a plan just because `terraform validate` succeeds.

For application-code-only changes, use the repository's application deployment process; do not run `terraform apply` unnecessarily.

## 6. Apply the reviewed plan

Only after completing the review and confirming this is the intended deployment:

```powershell
terraform apply -input=false .\deployment.tfplan
```

This applies the exact saved plan. If the plan becomes stale because the configuration or state changes, generate a new plan and review it again rather than trying to force the old one.

Terraform provisioning only creates/configures AWS resources. The EC2 user-data bootstrap then installs Docker tooling, clones the selected repository ref, fetches the two SSM parameters, writes local runtime configuration, builds the container, and starts the application service.

## 7. Allowlist Aiven and verify the deployment

After Terraform completes, add the Elastic IP to Aiven:

```powershell
terraform output -raw aiven_trusted_source_cidr
```

Add that `/32` to the Aiven service's trusted sources/IP allowlist. Terraform does not change Aiven. The application may fail to connect until the allowlist update takes effect.

Get the main outputs:

```powershell
terraform output
terraform output -raw instance_id
terraform output -raw instance_public_ip
terraform output -raw health_url
```

Test the HTTP health endpoint from a machine whose public IP matches `allowed_cidr`:

```powershell
$healthUrl = terraform output -raw health_url
Invoke-RestMethod -Method Get -Uri $healthUrl
```

Expected response:

```json
{"status":"ok"}
```

Then send a GraphQL request to confirm the GraphQL server responds. For the schema in the base branch, use a query such as:

```powershell
$graphqlUrl = $healthUrl -replace '/health$', '/graphql'
$payload = @{
    query = 'query SmokeTest { users { id name email } }'
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri $graphqlUrl -ContentType "application/json" -Body $payload
```

A valid GraphQL response contains a `data` object; it may contain an empty list if the configured database has no records. Check `errors` in the response as well. A successful `/health` response alone does not prove the MySQL connection works.

## 8. Administration and troubleshooting

### Access the instance with Session Manager

From a workstation configured for the same AWS identity:

```powershell
$instanceId = terraform output -raw instance_id
aws ssm start-session --target $instanceId --region us-east-1
```

No inbound SSH rule or SSH key is required. In the SSM session, these commands help diagnose bootstrap and application failures:

```bash
sudo tail -n 150 /var/log/user-data-deploy.log
cd /opt/nest-graphql-mysql
sudo docker compose --env-file .env.prod ps
sudo docker compose --env-file .env.prod logs --tail=100 api
sudo systemctl status nest-graphql-mysql-compose.service
```

Do not print `/opt/nest-graphql-mysql/secrets/mysql_db_password` to the terminal or logs.

### Common problems

| Symptom | Checks |
|---|---|
| AWS provider missing / provider not installed | Run `terraform init`, then `terraform validate`. |
| AWS `AccessDenied` | Check `aws sts get-caller-identity`, selected profile, account, and required EC2/VPC/IAM/SSM permissions. |
| Browser cannot reach port 8085 | Verify the client's current public IP matches `allowed_cidr` and security-group ingress. If the IP changed, update your local vars and review the plan before applying. |
| App cannot connect to MySQL | Verify the database already exists, host/port/user/name are correct, the Elastic IP is allowlisted in Aiven, and the correct CA certificate is in SSM. Keep TLS certificate verification enabled. |
| Bootstrap cannot fetch SSM parameters | Verify the parameter names, AWS account/region, parameter types, and EC2 role access. |
| Container fails or never becomes healthy | Inspect `/var/log/user-data-deploy.log`, `docker compose ps`, and `docker compose logs --tail=100 api`. Verify Docker/Compose/Buildx installation and Aiven access. |
| Plan proposes replacing an instance that should remain | Stop. Confirm the current state belongs to this deployment, inspect user-data/config changes and the full plan, then decide on an intentional migration/replacement. Do not apply blindly. |

## 9. Major settings developers commonly change

| Setting | File | Guidance |
|---|---|---|
| AWS region | `variables.tf` | Restricted to `us-east-1`; do not change for this template. |
| Client IP allowed to call API | `terraform.tfvars` → `allowed_cidr` | Use a trusted client CIDR, usually `x.x.x.x/32`. Keep it narrow. |
| Git repository/ref | `repository_url`, `repository_ref` in `terraform.tfvars` | Pin `repository_ref` to a commit SHA for repeatability. Bootstrap changes/redeployments can cause an instance replacement. |
| MySQL host, port, username, database | `terraform.tfvars` | Must match an existing Aiven service and database. Default DB is `graphql_demo`; Terraform does not create or migrate it. |
| Parameter Store prefix | `ssm_parameter_prefix` | Both the password and CA parameters must exist under this prefix. The instance role policy is built from it. |
| Resource names | `project_name`, `environment_name` in `terraform.tfvars` | Choose unique values for independent deployments in the same account. |
| Instance size and disk | `instance_type`, `root_volume_size_gib` | Disk size must be between 8 and 100 GiB. Changes affect cost; review the plan. |
| VPC/subnet ranges | `vpc_cidr`, `public_subnet_cidr` | Choose valid, non-overlapping ranges that do not conflict with existing networks. |
| Docker Compose version | `docker_compose_version` | Declared in `variables.tf` and the example vars file as an optional override. |
| Buildx version/checksum | `infra/user_data.sh.tftpl` | Both the pinned version and checksum must be updated together and verified. This changes EC2 bootstrap/user data and may replace the instance. |
| Application port | Security group, `docker-compose.yml`, app configuration/bootstrap | If changing port 8085, update all related configuration together and review security implications. |

## 10. Destroy and clean up

This is a disposable test deployment. Destroy only the deployment represented by the current Terraform state. First generate and inspect a destroy plan:

```powershell
terraform plan -destroy -input=false -no-color -var-file="terraform.tfvars" -out="destroy.tfplan"
terraform show -no-color .\destroy.tfplan

# Only after verifying the resources and account:
terraform apply -input=false .\destroy.tfplan
```

Destroying the deployment removes the Terraform-managed EC2/networking/IAM/EIP resources and deletes the instance's root disk. The two SSM parameters were created manually and remain; remove them manually if they are no longer needed. Remove the Elastic IP from Aiven trusted sources. The external Aiven service/database and its data are not managed or deleted by this Terraform configuration.

## Cost notes

The original estimate for this disposable setup is approximately `$0.0208/hour` for `t3.small`, `$0.005/hour` for one public IPv4 address, and about `$0.64/month` for 8 GiB gp3 storage, before taxes and incidental transfer. Prices change; check current AWS pricing before deploying. No NAT Gateway or load balancer is provisioned.

## Git hygiene checklist

Commit `infra/.terraform.lock.hcl` and the Terraform source/documentation. Do **not** commit:

- `infra/terraform.tfvars` or `terraform.tfvars.json`.
- `infra/.terraform/`, Terraform state/backups, crash logs, or `*.tfplan` files.
- Database password files, actual runtime environment files, certificates, private keys, or other secret material.

The root `.gitignore` already excludes the local Terraform state, working directory, variables, and plan files. Review `git status --short` before committing any infrastructure-related changes.
