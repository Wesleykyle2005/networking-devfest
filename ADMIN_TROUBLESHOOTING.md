# Admin Panel Dropdown Not Showing - Troubleshooting

## 🔍 **The Issue**

Admin panel link doesn't show in dropdown menu in production, but navigating to `/admin` manually works.

---

## 🎯 **Root Cause**

The `ADMIN_EMAILS` environment variable might not be set correctly in **Vercel production**.

---

## ✅ **How to Fix**

### **Step 1: Check Vercel Environment Variables**

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Look for `ADMIN_EMAILS`

### **Step 2: Verify the Value**

The value should be:
```
your-email@gmail.com
```

Or for multiple admins:
```
admin1@gmail.com,admin2@gmail.com,admin3@gmail.com
```

**Important:**
- ✅ Use **commas** to separate emails (no spaces)
- ✅ Make sure it's set for **Production** environment
- ✅ Email must match **exactly** with your login email

### **Step 3: Check Which Environments**

Make sure `ADMIN_EMAILS` is checked for:
- ✅ **Production**
- ✅ **Preview** (optional)
- ✅ **Development** (optional)

### **Step 4: Redeploy**

After adding/updating the environment variable:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** menu
4. Click **Redeploy**
5. Check "Use existing Build Cache" is **unchecked**
6. Click **Redeploy**

---

## 🧪 **How to Test**

### **In Local Development:**

1. Check your terminal logs when you load a page
2. You should see:
   ```
   [env-config] ADMIN_EMAILS raw: your-email@gmail.com
   [env-config] Parsed admin emails: [ 'your-email@gmail.com' ]
   [layout] User email: your-email@gmail.com
   [layout] Is admin: true
   ```

3. If you see `Is admin: false`, the email doesn't match

### **In Production:**

1. Log in with your admin email
2. Open the profile dropdown
3. You should see "Panel de administración" with a shield icon
4. If not, check Vercel logs:
   - Go to Vercel dashboard
   - Click on your project
   - Go to **Deployments**
   - Click on the latest deployment
   - Click **View Function Logs**
   - Look for any errors

---

## 🔧 **Common Issues**

### **Issue 1: Email Doesn't Match**

**Problem:** Your login email is different from `ADMIN_EMAILS`

**Solution:**
- Check what email you're logged in with
- Update `ADMIN_EMAILS` to match exactly

### **Issue 2: Environment Variable Not Set**

**Problem:** `ADMIN_EMAILS` is empty or not set in Vercel

**Solution:**
- Add it in Vercel dashboard
- Redeploy

### **Issue 3: Wrong Environment**

**Problem:** `ADMIN_EMAILS` is set for Preview but not Production

**Solution:**
- Check all three checkboxes (Production, Preview, Development)
- Redeploy

### **Issue 4: Cached Build**

**Problem:** Old build is cached without the new environment variable

**Solution:**
- Redeploy with "Use existing Build Cache" **unchecked**

---

## 📋 **Quick Checklist**

- [ ] `ADMIN_EMAILS` is set in Vercel
- [ ] Email matches your login email exactly
- [ ] Environment variable is set for **Production**
- [ ] Redeployed after adding/updating
- [ ] Cleared build cache during redeploy
- [ ] Logged in with the correct email
- [ ] Refreshed the page after deployment

---

## 🎯 **Expected Behavior**

### **When Working Correctly:**

1. **Login** with admin email
2. **Click** profile dropdown
3. **See** "Panel de administración" option
4. **Click** it to go to `/admin`

### **Dropdown Should Show:**

```
┌─────────────────────────────────┐
│ [Avatar] Your Name              │
│          your@email.com         │
├─────────────────────────────────┤
│ 👤 Ver mi perfil                │
│ ✏️  Editar perfil               │
│ 📱 Mi código QR                 │
├─────────────────────────────────┤
│ 🛡️  Panel de administración     │  ← This should appear
├─────────────────────────────────┤
│ 🚪 Cerrar sesión                │
└─────────────────────────────────┘
```

---

## 💡 **Pro Tip**

If you want to add multiple admins, use this format in Vercel:

```
admin1@gmail.com,admin2@gmail.com,admin3@gmail.com
```

**No spaces, just commas!**

---

## 🆘 **Still Not Working?**

If the dropdown still doesn't show after following all steps:

1. Check Vercel function logs for errors
2. Verify you're logged in with the correct email
3. Try logging out and logging back in
4. Clear browser cache
5. Check if `/admin` page works when accessed directly

If `/admin` works but dropdown doesn't show, there might be a deployment issue. Try:
- Pushing a small change to trigger a new deployment
- Checking Vercel deployment logs for build errors
