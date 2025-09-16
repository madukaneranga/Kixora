# SportPro - Single Brand eCommerce Platform

A production-ready eCommerce platform built with React, TypeScript, Tailwind CSS, and Supabase. Features a complete shoe store with inventory management, payment processing, and admin dashboard.

## 🚀 Features

### Customer Features
- **Product Catalog**: Browse products with filtering, search, and sorting
- **Product Variants**: Multiple sizes and colors with individual inventory tracking
- **Shopping Cart**: Persistent cart with guest/user merge functionality
- **User Authentication**: Secure signup/signin with Supabase Auth
- **Wishlist**: Save favorite products (registered users)
- **Secure Checkout**: PayHere payment gateway integration
- **Order Management**: Track order status and history
- **Reviews & Ratings**: Customer feedback system
- **Responsive Design**: Optimized for all device types

### Admin Features
- **Product Management**: CRUD operations for products and variants
- **Inventory Tracking**: Real-time stock management
- **Order Management**: View and update order statuses
- **User Management**: View users and assign admin roles
- **Image Management**: Upload and manage product images

### Technical Features
- **Payment Adapter Pattern**: Easy integration of multiple payment providers
- **Real-time Inventory**: Automatic stock updates on successful payments
- **Secure Database**: Row-level security (RLS) policies
- **Image Storage**: Supabase Storage for product images
- **Edge Functions**: Server-side payment processing
- **TypeScript**: Full type safety throughout the application

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **State Management**: Zustand, React Query
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Database**: PostgreSQL with RLS policies
- **Payments**: PayHere (with Stripe adapter ready)
- **Forms**: React Hook Form with Yup validation

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd sportpro-ecommerce
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase project**
   - Create a new project at [supabase.com](https://supabase.com)
   - Get your project URL and anon key
   - Create a storage bucket named `product-images` (public)

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase and PayHere credentials.

5. **Run database migrations**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Run the migration files in order:
     - `supabase/migrations/01_initial_schema.sql`
     - `supabase/migrations/02_seed_data.sql`
     - `supabase/migrations/03_inventory_functions.sql`

6. **Deploy Edge Functions**
   ```bash
   # Note: Supabase CLI is not available in this environment
   # You'll need to manually create these functions in your Supabase dashboard
   # Copy the content from supabase/functions/ to your project
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Supabase Setup

1. **Authentication**
   - Enable email/password authentication
   - Disable email confirmation for development
   - Set up redirect URLs for production

2. **Storage**
   - Create `product-images` bucket
   - Set to public for easy image access
   - Configure appropriate file size limits

3. **Database**
   - Run all migration files in sequence
   - Create an admin user by updating the profiles table:
     ```sql
     UPDATE profiles SET role = 'admin' WHERE email = 'your-email@domain.com';
     ```

### PayHere Setup

1. **Create PayHere Account**
   - Sign up at [payhere.lk](https://www.payhere.lk)
   - Get your Merchant ID and Secret Key
   - Set up webhook URLs pointing to your Supabase Edge Function

2. **Configure Webhooks**
   - Notify URL: `https://your-project.supabase.co/functions/v1/payment-webhook`
   - Return URL: `https://your-domain.com/payment/success`
   - Cancel URL: `https://your-domain.com/payment/cancel`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── cart/           # Shopping cart components
│   ├── layout/         # Header, Footer, Navigation
│   ├── products/       # Product-related components
│   └── ui/             # Base UI components (Button, Input, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Supabase client)
├── pages/              # Page components
├── paymentProviders/   # Payment adapter implementations
├── stores/             # Zustand state stores
└── types/              # TypeScript type definitions

supabase/
├── functions/          # Edge Functions
│   ├── create-payment/ # Payment creation endpoint
│   └── payment-webhook/# Payment webhook handler
└── migrations/         # Database schema and seeds
```

## 🔐 Security

- **Row Level Security**: All user data protected by RLS policies
- **Payment Security**: Server-side payment processing with signature validation
- **Authentication**: Supabase Auth handles secure user management
- **Input Validation**: Client and server-side validation
- **Environment Variables**: Sensitive data kept in environment variables

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```
   Or connect your GitHub repository to Vercel/Netlify for automatic deployments.

### Backend Setup

1. **Edge Functions**: Already deployed with Supabase
2. **Database**: Migrations run on Supabase
3. **Storage**: Configured in Supabase dashboard

### Environment Variables for Production

Update your production environment with:
- Production Supabase URLs
- Production PayHere credentials
- Production return/cancel URLs

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Product browsing and filtering
- [ ] Add to cart (guest and logged-in users)
- [ ] Cart persistence and merging
- [ ] Checkout flow
- [ ] PayHere payment processing
- [ ] Order status updates
- [ ] Admin product management
- [ ] Inventory updates after purchase

### Test Payment

Use PayHere sandbox credentials:
- Test Card: 4916217501611292
- Expiry: Any future date
- CVV: Any 3 digits

## 🔄 Adding New Payment Providers

The payment system uses an adapter pattern for easy extension:

1. **Create provider class**
   ```typescript
   // src/paymentProviders/stripe.ts
   export class StripeProvider implements PaymentProvider {
     // Implement required methods
   }
   ```

2. **Add to provider registry**
   ```typescript
   // src/paymentProviders/index.ts
   export const paymentProviders = {
     payhere: payHereProvider,
     stripe: stripeProvider, // Add new provider
   };
   ```

3. **Create Edge Function**
   - Add new function for provider-specific endpoints
   - Handle webhooks and payment creation

## 📝 API Endpoints

### Edge Functions

- `POST /functions/v1/create-payment` - Create payment intent
- `POST /functions/v1/payment-webhook` - Handle payment callbacks

### Database Functions

- `decrement_variant_stock(variant_id, quantity)` - Update inventory
- `check_variant_availability(variant_id, quantity)` - Check stock

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please check:
1. This README file
2. Supabase documentation
3. PayHere developer docs
4. Create an issue in the repository

## 🎯 Roadmap

- [ ] Advanced product filtering
- [ ] Wishlist sharing
- [ ] Product recommendations
- [ ] Email notifications
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Customer service chat
- [ ] Inventory alerts
- [ ] Bulk product import/export

---

Built with ❤️ for the modern eCommerce experience.