# Detailed Installation Guide

## Prerequisites Check

Before starting, verify you have the required software:

```bash
# Check Node.js version (should be 18.0.0 or higher)
node --version

# Check npm version (should be 8.0.0 or higher)
npm --version

# Check Git version
git --version
```

If any are missing, install them:
- **Node.js**: Download from [nodejs.org](https://nodejs.org/)
- **Git**: Download from [git-scm.com](https://git-scm.com/)

## Step 1: Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/yourusername/mortgage-prequalification.git

# Or clone via SSH
git clone git@github.com:yourusername/mortgage-prequalification.git

# Navigate to project directory
cd mortgage-prequalification
```

## Step 2: Backend Setup

### Install Dependencies

```bash
cd backend
npm install
```

### Create Environment File

```bash
# Copy the example file
cp .env.example .env

# Or create manually
touch .env
```

### Configure Environment Variables

Edit `.env` with your preferred editor:

```bash
# Using nano
nano .env

# Or using VS Code
code .env
```

Add the following configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
SESSION_SECRET=generate-a-secure-random-string-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACyour-account-sid-here
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid Configuration  
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=verified@yourdomain.com
```

### Generate Session Secret

For the `SESSION_SECRET`, generate a secure random string:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Verify Backend Installation

```bash
# Start the backend in development mode
npm run start:dev
```

You should see:
```
[Nest] INFO [NestApplication] Nest application successfully started
Listening on port 3000
```

## Step 3: Frontend Setup

Open a new terminal window/tab:

### Install Dependencies

```bash
cd frontend
npm install
```

### Create Environment File

```bash
# Create .env file
touch .env
```

### Configure Frontend Environment

Edit `.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
```

### Verify Frontend Installation

```bash
# Start the frontend development server
npm run dev
```

You should see:
```
VITE ready in X ms
➜ Local: http://localhost:5173/
```

## Step 4: External Services Setup

### OpenAI Setup

1. **Create Account**
   - Go to [platform.openai.com](https://platform.openai.com)
   - Sign up or log in

2. **Generate API Key**
   - Navigate to API Keys section
   - Click "Create new secret key"
   - Copy the key immediately (shown only once)

3. **Add Credits**
   - Go to Billing section
   - Add payment method
   - Add credits ($5-10 for testing)

### Twilio Setup

1. **Create Account**
   ```
   https://www.twilio.com/try-twilio
   ```

2. **Get Credentials**
   - Account SID: Found on dashboard
   - Auth Token: Click to reveal on dashboard
   - Phone Number: Get from Phone Numbers > Manage

3. **Configure Geographic Permissions**
   - Go to Geo Permissions
   - Enable countries you'll send SMS to

### SendGrid Setup

1. **Create Account**
   ```
   https://signup.sendgrid.com/
   ```

2. **Create API Key**
   - Settings > API Keys
   - Create API Key
   - Select "Full Access"
   - Copy the key

3. **Verify Sender**
   - Settings > Sender Authentication
   - Single Sender Verification
   - Add and verify your email

## Step 5: Test the Installation

### Test Backend Connection

```bash
# In a new terminal, test the API
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok"}
```

### Test Frontend Loading

1. Open browser to `http://localhost:5173`
2. You should see the chat interface
3. Check browser console for any errors (F12)

### Test Chat Flow

1. Type "I want to purchase a home"
2. Follow the conversation flow
3. Provide test data when asked

### Test SMS (Optional)

If you have Twilio configured:
```bash
cd backend
npm run test:sms
```

## Step 6: Common Installation Issues

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Port already in use

```bash
# Find process using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Issue: WebSocket connection fails

1. Check backend is running
2. Verify CORS settings
3. Check firewall/antivirus blocking

### Issue: Environment variables not loading

```bash
# Verify .env file exists
ls -la backend/.env

# Check file permissions
chmod 644 backend/.env

# Restart the server
npm run start:dev
```

## Step 7: Development Tools Setup (Optional)

### VS Code Extensions

Install recommended extensions:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "christian-kohler.npm-intellisense",
    "mrmlnc.vscode-less"
  ]
}
```

### Git Hooks

Set up pre-commit hooks:
```bash
npm install --save-dev husky lint-staged
npx husky init
```

## Step 8: Verify Complete Installation

Run the installation verification script:

```bash
# Create verification script
cat > verify-installation.sh << 'EOF'
#!/bin/bash

echo "Checking Node.js..."
node --version

echo "Checking npm..."
npm --version

echo "Checking backend dependencies..."
cd backend && npm list --depth=0

echo "Checking frontend dependencies..."
cd ../frontend && npm list --depth=0

echo "Checking environment files..."
if [ -f "../backend/.env" ]; then
    echo "✓ Backend .env exists"
else
    echo "✗ Backend .env missing"
fi

if [ -f ".env" ]; then
    echo "✓ Frontend .env exists"
else
    echo "✗ Frontend .env missing"
fi

echo "Installation verification complete!"
EOF

# Make it executable
chmod +x verify-installation.sh

# Run it
./verify-installation.sh
```

## Next Steps

1. Read the [README.md](./README.md) for usage instructions
2. Check [PROGRESS.md](./PROGRESS.md) for development status
3. Review [REQUIREMENTS.md](./REQUIREMENTS.md) for system requirements

## Support

If you encounter issues during installation:
1. Check the Troubleshooting section in README.md
2. Review error logs in terminal
3. Create an issue in the repository with:
   - Error messages
   - Steps to reproduce
   - System information