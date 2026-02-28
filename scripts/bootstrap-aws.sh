#!/usr/bin/env bash
# =============================================================================
# Bootstrap script — primera vez que desplegamos en AWS
#
# Orden:
#   1. CDK bootstrap (una sola vez por cuenta/región)
#   2. Deploy solo del stack ECR (crea el registro)
#   3. Build + push de la imagen Docker a ECR
#   4. Deploy del resto de stacks (VPC, Secrets, RDS, ECS, Monitoring)
#
# Uso:
#   AWS_PROFILE=test-samy ALERT_EMAIL=tu@email.com bash scripts/bootstrap-aws.sh
# =============================================================================
set -euo pipefail

AWS_PROFILE="${AWS_PROFILE:-test-samy}"
AWS_REGION="${AWS_REGION:-us-east-1}"
ALERT_EMAIL="${ALERT_EMAIL:-}"

export AWS_PROFILE AWS_REGION

echo ""
echo "========================================"
echo " Incident & Status Portal — AWS Bootstrap"
echo "========================================"
echo " Profile : $AWS_PROFILE"
echo " Region  : $AWS_REGION"
echo ""

# -- Verificar credenciales ---------------------------------------------------
echo "▶ Verificando credenciales AWS..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "  Cuenta: $ACCOUNT_ID"
echo ""

# -- 1. CDK Bootstrap ---------------------------------------------------------
echo "▶ Paso 1/4 — CDK Bootstrap (una sola vez por cuenta/región)..."
cd "$(dirname "$0")/../infra"
npm ci --silent
npx cdk bootstrap "aws://$ACCOUNT_ID/$AWS_REGION"
echo ""

# -- 2. Deploy solo ECR -------------------------------------------------------
echo "▶ Paso 2/4 — Deploy del stack ECR..."
npx cdk deploy IncidentsEcrStack --require-approval never
ECR_URI=$(aws cloudformation describe-stacks \
  --stack-name IncidentsEcrStack \
  --query "Stacks[0].Outputs[?ExportName=='IncidentsEcrRepositoryUri'].OutputValue" \
  --output text)
echo "  ECR URI: $ECR_URI"
echo ""

# -- 3. Build + Push imagen Docker --------------------------------------------
echo "▶ Paso 3/4 — Build y push de imagen Docker..."
cd "$(dirname "$0")/../backend"

aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin \
    "$(echo "$ECR_URI" | cut -d'/' -f1)"

docker build \
  --platform linux/amd64 \
  -t "$ECR_URI:latest" \
  -t "$ECR_URI:bootstrap" \
  .

docker push "$ECR_URI:latest"
docker push "$ECR_URI:bootstrap"
echo "  Imagen pusheada: $ECR_URI:latest"
echo ""

# -- 4. Deploy del resto de stacks --------------------------------------------
echo "▶ Paso 4/4 — Deploy del resto de stacks..."
cd "$(dirname "$0")/../infra"

DEPLOY_ARGS="--require-approval never"
if [ -n "$ALERT_EMAIL" ]; then
  export ALERT_EMAIL
fi

npx cdk deploy \
  IncidentsVpcStack \
  IncidentsSecretsStack \
  IncidentsRdsStack \
  IncidentsEcsStack \
  IncidentsMonitoringStack \
  $DEPLOY_ARGS

# -- Outputs ------------------------------------------------------------------
echo ""
echo "========================================"
echo " Deploy completado exitosamente"
echo "========================================"
echo ""

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name IncidentsEcsStack \
  --query "Stacks[0].Outputs[?ExportName=='IncidentsAlbDnsName'].OutputValue" \
  --output text)

ECS_SG=$(aws cloudformation describe-stacks \
  --stack-name IncidentsVpcStack \
  --query "Stacks[0].Outputs[?ExportName=='IncidentsEcsSgId'].OutputValue" \
  --output text)

# Subnets privadas (para las migraciones en CI/CD)
PRIVATE_SUBNET=$(aws ec2 describe-subnets \
  --filters "Name=tag:Name,Values=IncidentsVpcStack/IncidentsVpc/privateSubnet1" \
  --query "Subnets[0].SubnetId" \
  --output text 2>/dev/null || echo "ver consola AWS")

echo " ALB URL          : http://$ALB_DNS"
echo " ECR URI          : $ECR_URI"
echo ""
echo " ── GitHub Secrets pendientes ──────────────────"
echo " ECS_SUBNET_ID         = $PRIVATE_SUBNET"
echo " ECS_SECURITY_GROUP_ID = $ECS_SG"
echo ""
echo " Configúralos con:"
echo "   gh secret set ECS_SUBNET_ID --repo alejandr0pg/incident-status-portal --body \"$PRIVATE_SUBNET\""
echo "   gh secret set ECS_SECURITY_GROUP_ID --repo alejandr0pg/incident-status-portal --body \"$ECS_SG\""
echo ""
