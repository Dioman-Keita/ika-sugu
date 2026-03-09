import CategoriesSection from "@/components/shop-page/filters/CategoriesSection";
import ColorsSection from "@/components/shop-page/filters/ColorsSection";
import DressStyleSection from "@/components/shop-page/filters/DressStyleSection";
import PriceSection from "@/components/shop-page/filters/PriceSection";
import SizeSection from "@/components/shop-page/filters/SizeSection";
import { Button } from "@/components/ui/button";

const Filters = () => {
  return (
    <>
      <hr className="border-t-border" />
      <CategoriesSection />
      <hr className="border-t-border" />
      <PriceSection />
      <hr className="border-t-border" />
      <ColorsSection />
      <hr className="border-t-border" />
      <SizeSection />
      <hr className="border-t-border" />
      <DressStyleSection />
      <Button
        type="button"
        className="bg-foreground text-background w-full rounded-full text-sm font-medium py-4 h-12"
      >
        Apply Filter
      </Button>
    </>
  );
};

export default Filters;
