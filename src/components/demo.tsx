import React from "react";
import { StackedCards } from "@/components/ui/glass-cards";

export const DefaultDemo: React.FC = () => {
  return (
    <div style={{ minHeight: "100vh" }}>
      <StackedCards />
    </div>
  );
};

export default DefaultDemo;
