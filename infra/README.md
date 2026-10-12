# Disposable EC2 deployment (Terraform)

This is a learning/test template for `nest-graphql-mysql`. It creates AWS resources only in **`us-east-1`** and does not create or modify resources until `terraform apply`.

## Architecture

- Amazon Linux 2023 x86-64 EC2 `t3.small` (2 vCPU, 2 GiB RAM).
- Encrypted 8 GiB gp3 root EBS volume with delete-on-termination.
- Dedicated VPC, one public subnet, route table and Internet Gateway.
- Elastic IP used for API access and Aiven trusted-source allowlisting.
- Inbound TCP/8085 only from `allowed_cidr`; no inbound SSH or MySQL.
- SSM Session Manager access and read-only SSM permissions for pre-created deployment secret parameters.
- External Aiven MySQL connected over TLS with CA verification enabled.
- No NAT Gateway, load balancer, RDS, ECR, EKS or CloudWatch log group in this phase.

## Prerequisites

- Terraform 1.6+ and AWS CLI v2 configured for the intended account in `us-east-1`.
- Your current public IPv4 address in CIDR form (typically `x.x.x.x/32`).
- The Aiven database password and the Aiven CA PEM certificate.
- Permissions to create EC2, VPC, IAM instance profile/role, EIP, and read SSM parameters.

## 1. Prepare SSM Parameter Store values

Create these parameters manually in **Systems Manager Parameter Store, us-east-1**:

| Name | Type | Value |
|---|---|---|
| `/nest-graphql-mysql/test/mysql-password` | SecureString | Aiven MySQL password |
| `/nest-graphql-mysql/test/mysql-ca-pem` | String | Full PEM contents of the Aiven CA certificate |

Terraform deliberately does not create or store these values in state. The instance role is limited to reading those exact parameter ARNs. The default expects the AWS-managed SSM encryption key. If using a customer-managed KMS key, add and review narrowly scoped `kms:Decrypt` permissions.

## 2. Configure variables

From this `infra/` directory:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Replace the example `allowed_cidr` with your current public IP followed by `/32`. The default example uses a documentation-only IP and intentionally will not allow a real client. Do not commit `terraform.tfvars`.

Defaults include the requested instance type and disk, the external MySQL hostname/port/database/user, and `us-east-1`. Pin `repository_ref` to a full commit SHA for repeatable deployments.

## 3. Plan and deploy

```bash
terraform fmt -recursive
terraform init
terraform validate
terraform plan
terraform apply
```

Review the plan before applying. No AWS resources are created until `terraform apply`.

## 4. Allowlist and test

1. Read `terraform output -raw aiven_trusted_source_cidr`.
2. Add that `/32` to the Aiven service's trusted sources/IP allowlist. Terraform does not modify Aiven.
3. Check the health endpoint:

   ```bash
   curl "$(terraform output -raw health_url)"
   ```

   Expected response: `{"status":"ok"}`.

4. Run a real GraphQL query too: the current `/health` endpoint verifies the HTTP process, not the MySQL connection.

The endpoint is plain HTTP for this disposable test and should not be treated as a production TLS termination design. The security group limits access to the configured CIDR.

## Administration and troubleshooting

Use EC2 Connect / Systems Manager Session Manager in `us-east-1`; no SSH key or inbound port 22 is required.

```bash
sudo tail -n 150 /var/log/user-data-deploy.log
cd /opt/nest-graphql-mysql
sudo docker compose --env-file .env.prod ps
sudo docker compose --env-file .env.prod logs --tail=100 api
sudo systemctl status nest-graphql-mysql-compose.service
```

The app may restart until the instance Elastic IP has been added to the Aiven allowlist. Check the parameter names and region if bootstrap cannot retrieve the SSM parameters. Do not print the password file to logs.

## Cost notes

Approximate on-demand baseline (US East / N. Virginia, before taxes and incidental transfer): `t3.small` about $0.0208/hour, one public IPv4 about $0.005/hour, and 8 GiB gp3 storage about $0.64/month pro-rated. The expected baseline is approximately $0.11 for 4 hours or $0.21 for 8 hours. Any applicable Free Tier credits may reduce the bill. No NAT Gateway or load balancer is provisioned.

## Destroy and cleanup

After testing:

```bash
terraform destroy
```

Verify EC2 is terminated, the EIP is released and the root volume is deleted. The two SSM parameters are deliberately kept outside Terraform and remain after destroy; manually remove them if no longer needed. Remove the EIP from Aiven trusted sources as well.

Never commit Terraform state, `.terraform/`, real `terraform.tfvars`, certificates, secret files or plan files. The TypeORM `synchronize: true` setting remains unchanged at your request; review it before production.
