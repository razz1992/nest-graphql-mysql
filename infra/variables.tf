variable "aws_region" {
  description = "Deployment region; restricted to us-east-1."
  type        = string
  default     = "us-east-1"
  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "This deployment template is restricted to us-east-1."
  }
}

variable "project_name" {
  description = "Resource name prefix."
  type        = string
  default     = "nest-graphql-mysql"
  validation {
    condition     = can(regex("^[a-zA-Z0-9-]{3,32}$", var.project_name))
    error_message = "project_name must be 3-32 letters, numbers or hyphens."
  }
}

variable "environment_name" {
  description = "Environment name."
  type        = string
  default     = "test"
}

variable "repository_url" {
  description = "Git clone URL."
  type        = string
  default     = "https://github.com/razz1992/nest-graphql-mysql.git"
}

variable "repository_ref" {
  description = "Branch, tag, or commit SHA to deploy."
  type        = string
  default     = "main"
}

variable "docker_compose_version" {
  description = "Pinned Docker Compose release."
  type        = string
  default     = "v5.6.0"
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.small"
}

variable "root_volume_size_gib" {
  description = "Encrypted gp3 root volume size."
  type        = number
  default     = 8
  validation {
    condition     = var.root_volume_size_gib >= 8 && var.root_volume_size_gib <= 100
    error_message = "root_volume_size_gib must be 8-100 GiB."
  }
}

variable "vpc_cidr" {
  description = "VPC IPv4 CIDR."
  type        = string
  default     = "10.40.0.0/16"
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid IPv4 CIDR."
  }
}

variable "public_subnet_cidr" {
  description = "Public subnet IPv4 CIDR."
  type        = string
  default     = "10.40.1.0/24"
  validation {
    condition     = can(cidrhost(var.public_subnet_cidr, 0))
    error_message = "public_subnet_cidr must be a valid IPv4 CIDR."
  }
}

variable "availability_zone" {
  description = "Optional AZ; empty selects the first available in us-east-1."
  type        = string
  default     = ""
}

variable "allowed_cidr" {
  description = "Trusted client IPv4 CIDR for API TCP/8085. Use your current IP/32."
  type        = string
  validation {
    condition     = can(cidrhost(var.allowed_cidr, 0)) && can(regex("^[0-9.]+/[0-9]+$", var.allowed_cidr))
    error_message = "allowed_cidr must be an IPv4 CIDR, preferably x.x.x.x/32."
  }
}

variable "mysql_db_host" {
  description = "External Aiven MySQL host."
  type        = string
  default     = "mysql-26d126af-kumarrajneesh75-9c63.l.aivencloud.com"
}

variable "mysql_db_port" {
  description = "External MySQL port."
  type        = number
  default     = 21599
}

variable "mysql_db_user" {
  description = "External MySQL username."
  type        = string
  default     = "avnadmin"
}

variable "mysql_db_name" {
  description = "External MySQL database name."
  type        = string
  default     = "graphql_demo"
}

variable "ssm_parameter_prefix" {
  description = "Prefix for pre-created SSM parameters; password and CA are not Terraform-managed."
  type        = string
  default     = "/nest-graphql-mysql/test"
  validation {
    condition     = startswith(var.ssm_parameter_prefix, "/") && !endswith(var.ssm_parameter_prefix, "/") && length(var.ssm_parameter_prefix) >= 2
    error_message = "ssm_parameter_prefix must start with / and not end with /."
  }
}

variable "extra_tags" {
  description = "Additional resource tags."
  type        = map(string)
  default     = {}
}
