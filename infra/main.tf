data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}
data "aws_ssm_parameter" "amazon_linux_2023_ami" {
  name = "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64"
}

locals {
  resource_name = "${var.project_name}-${var.environment_name}"
  selected_az   = var.availability_zone != "" ? var.availability_zone : data.aws_availability_zones.available.names[0]
  common_tags = merge({
    Project     = var.project_name
    Environment = var.environment_name
    ManagedBy   = "Terraform"
    Purpose     = "Disposable learning deployment"
  }, var.extra_tags)
  password_parameter_arn = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_prefix}/mysql-password"
  ca_parameter_arn       = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_prefix}/mysql-ca-pem"
}

resource "aws_vpc" "app" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = { Name = "${local.resource_name}-vpc" }
}
resource "aws_internet_gateway" "app" {
  vpc_id = aws_vpc.app.id
  tags   = { Name = "${local.resource_name}-igw" }
}
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.app.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = local.selected_az
  map_public_ip_on_launch = false
  tags = { Name = "${local.resource_name}-public-subnet" }
}
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.app.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.app.id
  }
  tags = { Name = "${local.resource_name}-public-rt" }
}
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
resource "aws_security_group" "app" {
  name        = "${local.resource_name}-sg"
  description = "Allow API access only from approved client CIDR; no inbound SSH or MySQL."
  vpc_id      = aws_vpc.app.id
  ingress {
    description = "NestJS API from approved tester CIDR"
    from_port   = 8085
    to_port     = 8085
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  egress {
    description = "Package downloads, SSM HTTPS and external MySQL TLS"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.resource_name}-sg" }
}

resource "aws_iam_role" "ec2_ssm" {
  name = "${local.resource_name}-ec2-ssm-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
      Action = "sts:AssumeRole"
    }]
  })
  tags = { Name = "${local.resource_name}-ec2-ssm-role" }
}
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2_ssm.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}
resource "aws_iam_role_policy" "read_deployment_parameters" {
  name = "${local.resource_name}-read-ssm-parameters"
  role = aws_iam_role.ec2_ssm.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ssm:GetParameter"]
      Resource = [local.password_parameter_arn, local.ca_parameter_arn]
    }]
  })
}
resource "aws_iam_instance_profile" "ec2_ssm" {
  name = "${local.resource_name}-instance-profile"
  role = aws_iam_role.ec2_ssm.name
}

resource "aws_instance" "app" {
  ami                         = data.aws_ssm_parameter.amazon_linux_2023_ami.value
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  iam_instance_profile        = aws_iam_instance_profile.ec2_ssm.name
  associate_public_ip_address = false
  user_data_replace_on_change = true
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }
  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_size_gib
    encrypted             = true
    delete_on_termination = true
  }
  user_data = templatefile("${path.module}/user_data.sh.tftpl", {
    aws_region                    = var.aws_region
    repository_url                = var.repository_url
    repository_ref                = var.repository_ref
    docker_compose_version        = var.docker_compose_version
    app_directory                 = "/opt/${var.project_name}"
    project_name                  = var.project_name
    mysql_db_host                 = var.mysql_db_host
    mysql_db_port                 = var.mysql_db_port
    mysql_db_user                 = var.mysql_db_user
    mysql_db_name                 = var.mysql_db_name
    mysql_password_parameter_name = "${var.ssm_parameter_prefix}/mysql-password"
    mysql_ca_parameter_name       = "${var.ssm_parameter_prefix}/mysql-ca-pem"
  })
  depends_on = [
    aws_iam_role_policy_attachment.ssm_core,
    aws_iam_role_policy.read_deployment_parameters,
    aws_route_table_association.public
  ]
  tags = { Name = local.resource_name }
}
resource "aws_eip" "app" {
  domain = "vpc"
  tags   = { Name = "${local.resource_name}-eip" }
}
resource "aws_eip_association" "app" {
  allocation_id = aws_eip.app.id
  instance_id   = aws_instance.app.id
}
