
import React from "react";
import { Button } from "@/components/ui/button";

const CATEGORIES = ["All", "Health", "Learning", "Fitness", "Personal", "Mental Health", "Productivity"];

interface CategoryFilterProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategoryFilter = ({ selectedCategory, onCategorySelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      {CATEGORIES.map(category => (
        <Button
          key={category}
          variant={selectedCategory === category ? "default" : "outline"}
          onClick={() => onCategorySelect(category)}
          className="transition-all duration-300"
        >
          {category}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
