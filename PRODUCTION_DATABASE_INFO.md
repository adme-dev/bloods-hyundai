# Production Database Information

## ✅ Status: PRODUCTION READY

The database has been successfully set up on **BOTH** branches:
- ✅ Development branch (for testing)
- ✅ **Production branch (LIVE)**

## 🔑 Production Credentials

### Sale Hyundai Dealer (Production)
```json
{
  "id": "70ff8127-18a7-449b-a288-1441baf9a466",
  "slug": "sale-hyundai",
  "name": "Sale Hyundai",
  "api_key": "dk_live_salehyundai_d394bd4e4535e890107abb48",
  "email": "enquiries@salehyundai.com.au",
  "phone": "(03) 5144 2877",
  "website_url": "https://salehyundai.com.au",
  "primary_color": "#001E50",
  "oem": "hyundai",
  "is_active": true,
  "created_at": "2025-12-09T11:33:40.787Z"
}
```

### Production Database Connection
```
postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-bitter-grass-a7xesaio-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

### Development Database Connection
```
postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-cold-term-a76493qz-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

## 📋 Tables in Production

All 7 tables are now live in production:

1. ✅ `dealer_groups` - Multi-dealership parent organizations
2. ✅ `dealers` - Tenant registry
3. ✅ `users` - Staff accounts (RLS enabled)
4. ✅ `enquiries` - Form submissions (RLS enabled)
5. ✅ `enquiry_notes` - Notes on enquiries (RLS enabled)
6. ✅ `enquiry_activity_log` - Audit trail (RLS enabled)
7. ✅ `email_logs` - Email tracking

## 🔐 Security

- ✅ Row-Level Security (RLS) enabled on all tenant-scoped tables
- ✅ 4 isolation policies active
- ✅ API key unique and indexed
- ✅ Cascade deletes configured

## 🌐 Environment Variables for Production

Add these to your **production** `.env` file:

```env
# Production Database
NEON_DATABASE_URL="postgresql://neondb_owner:npg_Uzwn9jFBd0bM@ep-bitter-grass-a7xesaio-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Sale Hyundai Dealer (Production)
NUXT_DEALER_ID="70ff8127-18a7-449b-a288-1441baf9a466"
NUXT_DEALER_API_KEY="dk_live_salehyundai_d394bd4e4535e890107abb48"

# Public endpoint
NUXT_PUBLIC_ENQUIRY_API_URL="https://salehyundai.com.au/api/enquiry"
```

## 📊 Branch Comparison

| Feature | Development Branch | Production Branch |
|---------|-------------------|-------------------|
| Branch ID | `br-fragrant-hill-a7q9omx0` | `br-tiny-credit-a7flvj6h` |
| Tables | ✅ 7 tables | ✅ 7 tables |
| RLS Policies | ✅ 4 policies | ✅ 4 policies |
| Dealer Seeded | ✅ Sale Hyundai | ✅ Sale Hyundai |
| Dealer ID | `3991e589-6a86-4a4f-ad30-f945ae876910` | `70ff8127-18a7-449b-a288-1441baf9a466` |
| API Key | `dk_live_salehyundai_eec059c8d8de7e8affc864e9` | `dk_live_salehyundai_d394bd4e4535e890107abb48` |
| Status | Testing | **PRODUCTION** |

## ⚠️ Important Notes

1. **Different API Keys**: Development and production have different API keys for security
2. **Different Dealer IDs**: Each branch has a unique dealer UUID
3. **Use Production for Live Site**: Update your production deployment to use the production credentials
4. **Keep Development for Testing**: Use development branch for testing new features

## 🚀 Next Steps

1. **Update Production Environment Variables**
   - Use the production API key in your live site
   - Update `NEON_DATABASE_URL` to production connection string

2. **Install Drizzle ORM**
   ```bash
   npm install drizzle-orm @neondatabase/serverless
   npm install -D drizzle-kit
   ```

3. **Create API Endpoints**
   - Implement `/api/enquiry` endpoint
   - Add tenant middleware
   - Update form submissions

4. **Test on Development First**
   - Always test changes on development branch
   - Verify data isolation
   - Then deploy to production

## 🔗 Quick Links

- **Production Console**: https://console.neon.tech/app/projects/green-tooth-34908352/branches/br-tiny-credit-a7flvj6h/tables
- **Development Console**: https://console.neon.tech/app/projects/green-tooth-34908352/branches/br-fragrant-hill-a7q9omx0/tables
- **Project Dashboard**: https://console.neon.tech/app/projects/green-tooth-34908352

## 📚 Documentation

- `DATABASE_SETUP.md` - Complete technical documentation
- `DATABASE_QUICK_START.md` - Implementation guide
- `env.database.example` - Environment variables template
- `memory-bank/PRD-enquiry-management-system.md` - Full PRD

---

**Status**: ✅ **PRODUCTION READY - Both branches fully configured**
**Last Updated**: December 9, 2025










