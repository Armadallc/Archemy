# Quick ngrok Setup for HTTPS Development

## Step 1: Sign Up for Free ngrok Account

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up with email (free account is fine)
3. Verify your email

## Step 2: Get Your Authtoken

1. After signing in, go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc123def456ghi789jkl012mno345pqr678stu901vwx234yz_5A6B7C8D9E0F`)

## Step 3: Install Authtoken

Run this command in your terminal (replace with your actual authtoken):

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

## Step 4: Start ngrok Tunnel

Once authenticated, start the tunnel:

```bash
# Make sure Expo is running on port 8083 (or whatever port you're using)
ngrok http 8083
```

## Step 5: Use HTTPS URL on iPhone

ngrok will display something like:

```
Forwarding   https://abc123.ngrok.io -> http://localhost:8083
```

Use the HTTPS URL (`https://abc123.ngrok.io`) on your iPhone instead of `http://192.168.12.227:8083`

## Step 6: Update Mobile App Configuration (if needed)

If your mobile app has hardcoded URLs, you may need to update them to use the ngrok URL. But for testing in the browser, just navigate to the ngrok URL directly.

## Notes

- **Free tier**: Limited to 1 tunnel at a time, URL changes each time you restart
- **Session duration**: Free tier has time limits, but fine for development
- **URL changes**: Each time you restart ngrok, you get a new URL (unless you pay for a static domain)

## Troubleshooting

### "authentication failed"
- Make sure you copied the full authtoken
- Make sure you ran `ngrok config add-authtoken` (not just `ngrok authtoken`)

### "tunnel not found"
- Make sure Expo is running on the port you specified
- Check that the port number matches (8083 in this case)

### URL not working on iPhone
- Make sure you're using the HTTPS URL (starts with `https://`)
- Make sure both devices are on the same network (or ngrok works from anywhere)
- Try refreshing the page on iPhone


