# Project Brief: Sale Hyundai Website

## Overview
Sale Hyundai is a Nuxt 3 website for a Hyundai car dealership in Sale, Victoria, Australia. The website provides customers with vehicle browsing, enquiry forms, finance calculators, and information about the dealership's services.

## Core Requirements

### Customer-Facing Features
1. **Vehicle Browsing**
   - New Hyundai models from OEM API
   - Used/demo car stock from dealership feed
   - Search, filter, and compare vehicles

2. **Enquiry Forms**
   - Contact enquiries (sales, service, parts, finance, general)
   - Vehicle-specific enquiries
   - Finance pre-approval
   - Sell my car valuations
   - Test drive bookings

3. **Special Offers**
   - Hyundai national offers
   - Dealer-specific promotions

4. **Content Pages**
   - WordPress-powered content pages
   - Vehicle detail pages
   - Calculator pages

### Staff/Admin Features (Planned)
1. **Enquiry Management System** (see PRD-enquiry-management-system.md)
   - Centralized dashboard for all enquiries
   - Staff authentication and role-based access
   - Enquiry tracking and analytics

## Technical Stack
- **Framework:** Nuxt 3 (with Nuxt 4 compatibility)
- **UI:** UIkit + UnoCSS/Tailwind + shadcn-vue components
- **State:** Pinia
- **Deployment:** Netlify
- **Backend:** Serverless functions (Nitro)
- **Database:** NEON PostgreSQL (planned for enquiry system)

## Project Goals
1. Modern, fast, mobile-responsive dealership website
2. Seamless customer enquiry experience
3. Staff efficiency through centralized lead management
4. SEO optimization for local search visibility
5. Integration with Hyundai Australia's vehicle data

## Constraints
- Must work with existing WordPress API for some content
- Must integrate with dealer's existing CRM (future phase)
- Netlify deployment constraints (serverless functions)







