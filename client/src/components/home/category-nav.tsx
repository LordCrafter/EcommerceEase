import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type Category = {
  id: number;
  category_id: string;
  category_name: string;
};

export default function CategoryNav() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center py-3 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-8 w-24 mr-2 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center py-3 overflow-x-auto scrollbar-hide">
          {categories?.map((category) => (
            <Link
              key={category.id}
              href={`/categories/${category.id}`}
              className="whitespace-nowrap px-4 py-2 mr-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-gray-100 rounded-md"
            >
              {category.category_name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
