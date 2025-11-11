# Grocery List App

A modern, responsive grocery list and meal planning application built for busy parents. Plan your weekly meals, manage your grocery lists, track pantry inventory, and coordinate with household members - all in one beautiful interface.

![Next.js](https://img.shields.io/badge/Next.js-14+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🛒 Grocery Lists
- Create and manage multiple grocery lists
- Add items with quantities, categories, and notes
- Check off items as you shop with satisfying strike-through
- Filter items by category (Produce, Dairy, Meat, Bakery, etc.)
- Share lists with household members
- Track shopping progress with visual progress bars

### 🍳 Weekly Meal Planner
- Plan meals for the entire week (Breakfast, Lunch, Dinner)
- Visual calendar view with easy navigation between weeks
- Add meals with ingredients and notes
- Generate grocery lists automatically from your meal plan
- Mobile-optimized scrollable calendar
- Quick stats showing meals planned and ingredients needed

### 🏺 Pantry Inventory
- Keep track of all pantry items in one place
- Set expiration dates and get alerts for items expiring soon
- Low stock warnings with customizable thresholds
- Search and filter by category
- Visual grid layout with item details
- Track when items were added and last updated

### 👨‍👩‍👧‍👦 Household Management
- Invite family members to collaborate
- Assign roles (Admin, Member, Viewer)
- See who last edited shared lists
- View all shared grocery lists in one place
- Real-time collaboration (coming soon with backend)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/grocery-list-app.git
cd grocery-list-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## 🏗️ Project Structure

```
grocery-list-app/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                 # Home/Dashboard
│   ├── grocery-lists/           # Grocery lists pages
│   ├── pantry/                  # Pantry inventory page
│   ├── meal-planner/            # Weekly meal planner page
│   └── household/               # Household management page
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Select.tsx
│   │   └── Badge.tsx
│   ├── grocery/                 # Grocery list components
│   ├── pantry/                  # Pantry components
│   ├── meal-planner/           # Meal planner components
│   ├── household/              # Household components
│   └── layout/                 # Layout components (Nav, etc.)
├── lib/                        # Utilities and helpers
│   ├── types.ts               # TypeScript type definitions
│   ├── utils.ts               # Utility functions
│   └── mockData.ts            # Mock data for prototype
├── __tests__/                 # Jest tests
└── public/                    # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary (Green)**: `#059669` - Actions, active states
- **Secondary (Blue)**: `#3B82F6` - Accents, information
- **Success (Green)**: `#10B981` - Success messages, Produce category
- **Warning (Yellow)**: `#F59E0B` - Warnings, low stock alerts
- **Danger (Red)**: `#EF4444` - Errors, Meat category

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, 2xl-3xl on mobile, 3xl-4xl on desktop
- **Body**: Regular, 14px-16px

### Touch Targets
- All interactive elements meet WCAG 2.1 minimum touch target size of 44×44px
- Optimized for mobile-first experience
- Large, easy-to-tap checkboxes and buttons

## 📱 Responsive Design

The app is fully responsive and optimized for:
- **Mobile**: 375px+ (iPhone SE and up)
- **Tablet**: 768px+ (iPad and similar)
- **Desktop**: 1024px+ (laptops and desktops)

### Mobile-First Features
- Bottom navigation bar for easy thumb access
- Full-width buttons on mobile
- Stacked layouts that expand on larger screens
- Scrollable calendar view for meal planner
- Touch-friendly 44×44px minimum touch targets

## 🧪 Testing

The project uses Jest and React Testing Library for unit and integration tests.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage
- UI Components: Button, Input, Card, Modal, Checkbox, Select, Badge
- Feature Components: All grocery, pantry, meal planner, and household components
- Utility Functions: Date formatting, className merging, etc.

## 🛠️ Built With

- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and better DX
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[React](https://react.dev/)** - UI library
- **[Jest](https://jestjs.io/)** - Testing framework
- **[React Testing Library](https://testing-library.com/react)** - Component testing

## 📋 Current Status

This is a **front-end prototype** built with mock data to demonstrate the user experience and interface. The app currently uses:
- Static mock data for all features
- Local state management with React useState
- No backend integration (coming soon!)

### Coming Soon
- [ ] Backend API integration
- [ ] Real-time collaboration with WebSockets
- [ ] User authentication and authorization
- [ ] Database persistence
- [ ] Push notifications for expiring items
- [ ] Recipe database integration
- [ ] Barcode scanning for pantry items
- [ ] Shopping list sharing via QR codes

## 🎯 Target Users

**Busy parents** who need to:
- Efficiently plan weekly meals for their family
- Manage grocery shopping without forgetting items
- Keep track of pantry inventory to reduce waste
- Coordinate meal planning and shopping with their partner

## 🤝 Contributing

Contributions are welcome! This is currently a prototype, but once the backend is integrated, we'll open it up for contributions.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and write tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Icons from [Heroicons](https://heroicons.com/)
- Font from [Google Fonts](https://fonts.google.com/)
- Design inspiration from modern productivity apps
- Built with ❤️ for busy parents everywhere

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

**Note**: This is currently a front-end UI prototype. Backend integration is in progress. All data is currently stored in browser state and will be lost on page refresh.

