# Environment Variables Reference

## Overview

Growth OS uses Supabase's built-in secrets management system for environment variables. All secrets are configured through the Supabase Dashboard under Project Settings > Edge Functions.

> **Warning:** Never store sensitive credentials in code. All API keys and secrets must be configured in Supabase's secure secrets management system.

## Required Environment Variables

### Core Supabase Configuration

| Variable | Purpose | Example | Where Used |
|----------|---------|---------|------------|
| `SUPABASE_URL` | Supabase project URL | `https://project.supabase.co` | Edge Functions, Client |
| `SUPABASE_ANON_KEY` | Public API key | `eyJhbGciOiJIUzI1Ni...` | Client-side operations |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin API key | `eyJhbGciOiJIUzI1Ni...` | Edge Functions only |
| `SUPABASE_DB_URL` | Direct database connection | `postgresql://...` | Database migrations |

> **Tip:** These values are automatically available in Supabase Edge Functions. Client-side configuration is handled in `src/integrations/supabase/client.ts`.

### Email Configuration (SMTP)

| Variable | Purpose | Example | Required For |
|----------|---------|---------|--------------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | All email sending |
| `SMTP_PORT` | SMTP server port | `587` | All email sending |
| `SMTP_USER` | SMTP username | `user@company.com` | All email sending |
| `SMTP_PASSWORD` | SMTP password/app password | `app_password_123` | All email sending |

### SMTP Configuration (Alternative Email)

| Variable | Purpose | Example | Default |
|----------|---------|---------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` | None |
| `SMTP_PORT` | SMTP server port | `587` | `587` |
| `SMTP_USER` | SMTP username | `user@domain.com` | None |
| `SMTP_PASSWORD` | SMTP password | `app_password_123` | None |
| `SMTP_FROM_EMAIL` | Default sender email | `noreply@company.com` | None |
| `SMTP_FROM_NAME` | Default sender name | `Growth OS` | `Growth OS` |


> **Warning:** Configure both LMS and billing SMTP settings with different sender addresses to avoid email delivery issues.

## Configuration by Environment

### Development Environment

```bash
# Local development uses Supabase project configuration
# No additional environment variables needed
npm run dev
```

### Staging Environment

All environment variables should mirror production but point to staging services:

- Use staging SMTP credentials
- Use staging database (separate Supabase project recommended)

### Production Environment

All secrets must be configured in Supabase Dashboard:

1. **Navigate to**: Project Settings → Edge Functions → Secrets
2. **Add each secret** with production values
3. **Deploy Edge Functions** to activate new configuration

## Hard-coded Configuration Values

### Application Constants

Located in `src/integrations/supabase/client.ts`:

```typescript
const SUPABASE_URL = "https://majqoqagohicjigmsilu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIs...";
```

### Supabase Configuration

Located in `supabase/config.toml`:

```toml
project_id = "majqoqagohicjigmsilu"
site_url = "https://majqoqagohicjigmsilu.lovable.app"
jwt_expiry = 3600
```

### Company Settings Defaults

Located in database table `company_settings`:

| Setting | Default Value | Configurable Via |
|---------|---------------|-------------------|
| `company_name` | "Your Company" | Admin Panel |
| `original_fee_amount` | 3000.00 | Admin Panel |
| `maximum_installment_count` | 3 | Admin Panel |
| `currency` | "USD" | Admin Panel |
| `invoice_overdue_days` | 30 | Admin Panel |
| `invoice_send_gap_days` | 7 | Admin Panel |
| `enable_student_signin` | false | Admin Panel |

## Configuration Override Instructions

### Changing Supabase Project

1. **Update client configuration**:
   ```typescript
   // src/integrations/supabase/client.ts
   const SUPABASE_URL = "https://newproject.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY = "new_anon_key";
   ```

2. **Update config.toml**:
   ```toml
   # supabase/config.toml
   project_id = "newproject"
   site_url = "https://newproject.lovable.app"
   ```

3. **Run database migrations**:
   ```bash
   supabase db reset
   supabase db push
   ```

### Email Service Configuration

**Option 1: SMTP Configuration (Recommended)**
```bash
# Set in Supabase Secrets
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@company.com
SMTP_FROM_NAME="Growth OS"
```

**Option 2: Custom SMTP**
```bash
# Set all SMTP variables in Supabase Secrets
SMTP_HOST=your.smtp.host
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASSWORD=your_password
```

### Company Branding

Upload custom assets via Admin Panel:
- **Logo**: Company Settings → Branding → Upload Logo
- **Favicon**: Automatically generated from logo
- **Colors**: Customize via CSS variables in `src/index.css`

## Validation Scripts

### Environment Check Script

Create `scripts/check-env.ts`:

```typescript
import { supabase } from '../src/integrations/supabase/client';

async function checkEnvironment() {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Supabase connection: OK');
    
    // Test email configuration
    const { data: testEmail, error: emailError } = await supabase.functions.invoke('whoami');
    console.log('✅ Edge Functions: OK');
    
  } catch (error) {
    console.error('❌ Environment check failed:', error);
  }
}

checkEnvironment();
```

### Secret Validation

```sql
-- Run in Supabase SQL Editor to check secret configuration
SELECT 
  CASE 
    WHEN current_setting('app.smtp_host', true) IS NOT NULL 
    THEN '✅ SMTP Configuration available'
    ELSE '❌ SMTP Configuration missing'
  END as smtp_status;
```

## Troubleshooting

### Common Issues

**1. Email Delivery Failures**
```bash
# Check SMTP configuration in Supabase Secrets
# Verify SMTP configuration if using custom SMTP
# Check sender email domain authentication
```

**2. Database Connection Issues**
```bash
# Verify SUPABASE_URL and keys match project
# Check RLS policies for permission errors
# Confirm user role assignments
```

**3. Edge Function Failures**
```bash
# Check Edge Function logs in Supabase Dashboard
# Verify all required secrets are configured
# Test individual functions via Supabase Functions tab
```

### Debug Commands

```bash
# Test Supabase connection
npx supabase status

# Check Edge Function logs
npx supabase functions logs <function-name>

# Validate database migrations
npx supabase db diff
```

## Security Best Practices

1. **Rotate secrets regularly** (quarterly recommended)
2. **Use different credentials** for staging and production
3. **Monitor Edge Function logs** for unauthorized access attempts
4. **Implement email rate limiting** to prevent abuse
5. **Audit secret access** through Supabase Dashboard logs

## Next Steps

Configure your environment using this reference, then proceed to [Deployment Guide](./deployment.md) for step-by-step setup instructions.
