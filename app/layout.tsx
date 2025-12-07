import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chop-n-Bike | Forest Platformer',
  description:
    'Web-based 3D platformer with procedural forest terrain, over-the-shoulder camera, and chop mechanics.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
