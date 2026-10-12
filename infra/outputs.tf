output "aws_region" {
  description = "Deployment region."
  value       = var.aws_region
}
output "instance_id" {
  description = "EC2 instance ID."
  value       = aws_instance.app.id
}
output "instance_type" {
  description = "EC2 instance type."
  value       = aws_instance.app.instance_type
}
output "instance_public_ip" {
  description = "Elastic IP used by the API and Aiven allowlist."
  value       = aws_eip.app.public_ip
}
output "aiven_trusted_source_cidr" {
  description = "Exact Elastic IP /32 to add to Aiven trusted sources."
  value       = "${aws_eip.app.public_ip}/32"
}
output "health_url" {
  description = "Health endpoint restricted by security group."
  value       = "http://${aws_eip.app.public_ip}:8085/health"
}
output "security_group_id" {
  description = "API ingress security group."
  value       = aws_security_group.app.id
}
output "ssm_password_parameter_name" {
  description = "Externally managed SecureString parameter; retained after destroy."
  value       = "${var.ssm_parameter_prefix}/mysql-password"
}
output "ssm_ca_parameter_name" {
  description = "Externally managed CA PEM parameter; retained after destroy."
  value       = "${var.ssm_parameter_prefix}/mysql-ca-pem"
}
