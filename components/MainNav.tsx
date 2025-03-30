// components/MainNav.tsx
'use client'; // Use client for hooks like usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";

const routes = [
    { href: '/cashier', label: 'Cashier' },
    { href: '/kitchen', label: 'Kitchen' },
    { href: '/kitchen/board', label: 'Order History' },
    // Add '/admin/dashboard' later when built
];

export default function MainNav() {
    const pathname = usePathname();

    return (
        <nav className="bg-background border-b sticky top-0 z-50"> {/* Make nav sticky */}
            <div className="container mx-auto px-4">
                <div className="flex h-14 items-center">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        {/* Optional: Add an SVG logo or image here */}
                        <span className="font-bold inline-block">
                            Rafiki's Kitchen
                        </span>
                    </Link>
                    <div className="flex items-center space-x-4 lg:space-x-6">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-primary",
                                    pathname === route.href ? "text-primary" : "text-muted-foreground"
                                )}
                            >
                                {route.label}
                            </Link>
                        ))}
                    </div>
                    {/* Optional: Add user menu or other items to the right */}
                    {/* <div className="ml-auto flex items-center space-x-4"> ... </div> */}
                </div>
            </div>
        </nav>
    );
}