import { ReactNode } from "react";
import Navigation from "./navigation";

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navigation />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
