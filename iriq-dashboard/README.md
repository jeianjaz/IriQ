# IriQ Smart Irrigation Dashboard

A modern web application for monitoring and controlling smart irrigation systems, built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Real-time Monitoring**: Track soil moisture levels in real-time
- **Smart Control**: Manually control irrigation system or set to automatic mode
- **Data Visualization**: View historical data with interactive charts
- **User Management**: Admin and regular user roles with appropriate permissions
- **Responsive Design**: Modern, clean UI that works on all devices

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **UI Components**: Custom components with Tailwind
- **Charts**: Recharts for data visualization
- **Authentication**: Email/password via Supabase Auth

## Project Structure

```
iriq-dashboard/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   │   ├── dashboard/   # Dashboard-specific components
│   │   └── ui/          # Reusable UI components
│   └── lib/             # Utility functions and shared code
├── .env.local           # Environment variables (not in git)
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up your Supabase database with the following tables:
   - `profiles`: User profiles with roles
   - `sensor_readings`: Soil moisture sensor data
   - `device_status`: Current status of irrigation devices
   - `control_commands`: Commands to control irrigation system

5. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Supabase Schema

The application requires the following tables in your Supabase database:

### profiles
- `id`: uuid (primary key, references auth.users.id)
- `email`: text (not null)
- `full_name`: text
- `role`: text (enum: 'admin', 'user', default: 'user')
- `created_at`: timestamp with time zone (default: now())

### sensor_readings
- `id`: uuid (primary key)
- `created_at`: timestamp with time zone (default: now())
- `device_id`: uuid (references profiles.id)
- `moisture_percentage`: integer (0-100)
- `moisture_digital`: boolean

### device_status
- `id`: uuid (primary key)
- `device_id`: uuid (references profiles.id)
- `pump_status`: boolean
- `automatic_mode`: boolean
- `updated_at`: timestamp with time zone (default: now())
- `user_id`: uuid (references profiles.id)

### control_commands
- `id`: uuid (primary key)
- `created_at`: timestamp with time zone (default: now())
- `device_id`: uuid (references profiles.id)
- `pump_control`: boolean
- `automatic_mode`: boolean
- `user_id`: uuid (references profiles.id)
- `executed`: boolean (default: false)

## Color Palette

The IriQ design uses a green-themed color palette:
- Light background: `#F6F8ED`
- Primary green: `#7AD63D`
- Dark green: `#002E1F`

## License

This project is licensed under the MIT License.
