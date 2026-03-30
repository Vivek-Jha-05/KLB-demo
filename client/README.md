# MedPharm - Pharmaceutical E-Commerce Platform

A complete pharmaceutical B2C e-commerce platform with prescription validation, simulated payments, and admin panel functionality.

## 🚀 Features

### Customer Features
- **Product Browsing**: Browse medicines by category, search, and filter
- **Product Details**: View detailed information, dosage, manufacturer info
- **Shopping Cart**: Add/remove items, quantity management
- **Prescription Upload**: Upload prescriptions for prescription-required medicines
- **Order Tracking**: Track order status and history
- **User Dashboard**: View orders, prescriptions, and profile

### Admin Features
- **Dashboard**: Overview of sales, orders, and pending actions
- **Product Management**: Add, edit, delete products
- **Order Management**: View and update order statuses
- **Prescription Review**: Approve or reject customer prescriptions

### Business Logic
- **Prescription Validation**: Products marked as requiring prescription need approved prescription before checkout
- **Order Status Flow**: pending_approval → approved → processing → shipped → delivered
- **Payment Integration**: Simulated Razorpay payment flow

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication components
│   ├── layout/        # Header, Footer, Layout
│   └── ui/            # Reusable UI components
├── data/              # Mock data
├── pages/
│   ├── admin/         # Admin panel pages
│   └── ...            # Customer-facing pages
├── store/             # Zustand state stores
├── types/             # TypeScript types
└── utils/             # Utility functions
```

## 🔐 Demo Credentials

**Customer Account:**
- Email: user@example.com
- Password: user123

**Admin Account:**
- Email: admin@medpharm.com
- Password: admin123

## 📱 Pages & Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/products` | Product listing with filters |
| `/product/:id` | Product detail page |
| `/cart` | Shopping cart & checkout |
| `/upload-prescription` | Prescription upload |
| `/dashboard` | User dashboard |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/orders` | Order management |
| `/admin/prescriptions` | Prescription management |

## 🗄️ Data Models

### User
- id, name, email, role (user/admin), createdAt

### Product
- id, name, price, category, description, image, stock, requiresPrescription, manufacturer, dosage

### Prescription
- id, userId, userName, fileUrl, fileName, status, reviewedBy, reviewedAt, notes, createdAt

### Order
- id, userId, userName, items, totalAmount, paymentStatus, orderStatus, prescriptionId, shippingAddress, createdAt, updatedAt

## 🔄 Order Flow

1. **Regular Products**: Add to cart → Checkout → Payment → Processing → Shipped → Delivered

2. **Prescription Products**: 
   - Add to cart
   - Upload prescription (if not already approved)
   - Order created with "pending_approval" status
   - Admin reviews and approves prescription
   - Order moves to "approved" → Payment → Processing → Shipped → Delivered

## 🎨 UI Components

- **Button**: Multiple variants (primary, secondary, outline, ghost, danger)
- **Input**: With label, error, and icon support
- **Card**: With header, content, footer sections
- **Badge**: Status indicators with color variants
- **Modal**: Accessible modal dialogs

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📝 Notes

This is a frontend-only implementation with mock backend services using Zustand for state management and localStorage for persistence. In a production environment, you would:

1. Replace mock stores with actual API calls
2. Implement real authentication with JWT
3. Connect to MongoDB for data persistence
4. Integrate actual Razorpay payment gateway
5. Use Cloudinary or similar for file uploads
6. Add proper error boundaries and loading states
7. Implement comprehensive form validation
8. Add unit and integration tests

## 🏗️ Future Enhancements

- [ ] Email notifications
- [ ] SMS OTP verification
- [ ] Wishlist functionality
- [ ] Product reviews and ratings
- [ ] Coupon/discount codes
- [ ] Multiple addresses
- [ ] Order cancellation/returns
- [ ] Real-time order tracking
- [ ] Chat support
